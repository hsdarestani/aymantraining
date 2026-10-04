import SwiftUI
import Security
import WatchKit

struct CompanionResponse: Codable {
  let ok: Bool
  let score: Score?
  let workout: Workout?
}
struct Score: Codable { let total: Int; let level: String; let recovery: Int?; let completeness: Int }
struct Workout: Codable { let id: String; let title: String; let scheduledAt: String?; let exercises: [Exercise] }
struct Exercise: Codable { let id: String; let name: String; let sets: Int; let reps: String?; let rpe: Int?; let restSeconds: Int; let completed: Int }
struct PairResponse: Codable { let ok: Bool; let sessionToken: String; let expiresAt: String }

enum KeychainStore {
  static let service="com.smarbiz.bedifferent.watch"
  static let account="session"
  static func save(_ value:String){
    let data=Data(value.utf8)
    SecItemDelete([kSecClass:kSecClassGenericPassword,kSecAttrService:service,kSecAttrAccount:account] as CFDictionary)
    SecItemAdd([kSecClass:kSecClassGenericPassword,kSecAttrService:service,kSecAttrAccount:account,kSecValueData:data] as CFDictionary,nil)
  }
  static func load()->String?{
    var out:CFTypeRef?
    let status=SecItemCopyMatching([kSecClass:kSecClassGenericPassword,kSecAttrService:service,kSecAttrAccount:account,kSecReturnData:true,kSecMatchLimit:kSecMatchLimitOne] as CFDictionary,&out)
    guard status==errSecSuccess,let data=out as? Data else{return nil}
    return String(data:data,encoding:.utf8)
  }
  static func clear(){SecItemDelete([kSecClass:kSecClassGenericPassword,kSecAttrService:service,kSecAttrAccount:account] as CFDictionary)}
}

@MainActor
final class WatchModel: ObservableObject {
  @Published var score:Score?
  @Published var workout:Workout?
  @Published var error:String?
  @Published var pairing=false
  @Published var paired=KeychainStore.load() != nil
  @Published var setNumber=1
  @Published var reps=8
  @Published var weight=0.0
  @Published var rpe=7

  private let base="https://bedifferent.smarbiz.sbs"
  private var token:String?{KeychainStore.load()}

  func pair(code:String) async {
    pairing=true;defer{pairing=false}
    guard code.count==6 else{error="Sechsstelligen Code eingeben.";return}
    do{
      var req=URLRequest(url:URL(string:base+"/api/companion/pair/claim")!);req.httpMethod="POST";req.setValue("application/json",forHTTPHeaderField:"content-type");req.httpBody=try JSONEncoder().encode(["code":code])
      let(data,res)=try await URLSession.shared.data(for:req);guard(res as? HTTPURLResponse)?.statusCode==200 else{throw URLError(.userAuthenticationRequired)}
      let pair=try JSONDecoder().decode(PairResponse.self,from:data);KeychainStore.save(pair.sessionToken);paired=true;error=nil;await refresh()
    }catch{self.error="Kopplung fehlgeschlagen oder Code abgelaufen."}
  }

  func request(_ path:String,method:String="GET",body:[String:Any]?=nil) async throws->Data{
    guard let token else{throw URLError(.userAuthenticationRequired)}
    var req=URLRequest(url:URL(string:base+path)!);req.httpMethod=method;req.setValue("Bearer \(token)",forHTTPHeaderField:"Authorization");req.setValue("watch",forHTTPHeaderField:"x-bd-client")
    if let body{req.setValue("application/json",forHTTPHeaderField:"content-type");req.httpBody=try JSONSerialization.data(withJSONObject:body)}
    let(data,res)=try await URLSession.shared.data(for:req);guard let http=res as? HTTPURLResponse,http.statusCode>=200&&http.statusCode<300 else{throw URLError(.badServerResponse)};return data
  }

  func refresh() async {
    do{
      let data=try await request("/api/companion");let decoded=try JSONDecoder().decode(CompanionResponse.self,from:data);score=decoded.score;workout=decoded.workout;error=nil
      if let ex=decoded.workout?.exercises.first(where:{$0.completed<$0.sets}){setNumber=ex.completed+1;reps=Int(ex.reps?.split(whereSeparator:{!$0.isNumber}).first ?? "8") ?? 8}
      syncWidget()
    }catch{self.error="Daten konnten nicht geladen werden."}
  }

  func logSet(exercise:Exercise) async {
    guard let workout else{return}
    do{
      _=try await request("/api/companion",method:"POST",body:["action":"set","workoutId":workout.id,"exerciseId":exercise.id,"setNumber":setNumber,"reps":reps,"weightKg":weight,"rpe":rpe])
      WKInterfaceDevice.current().play(.success);await refresh()
    }catch{self.error="Satz konnte nicht gespeichert werden."}
  }

  func completeWorkout() async {
    guard let workout else{return}
    do{_=try await request("/api/companion",method:"POST",body:["action":"complete","workoutId":workout.id,"rpe":rpe]);WKInterfaceDevice.current().play(.success);await refresh()}
    catch{self.error="Training konnte nicht abgeschlossen werden."}
  }

  func logout(){KeychainStore.clear();paired=false;score=nil;workout=nil}
  func syncWidget(){
    let d=UserDefaults(suiteName:"group.com.smarbiz.bedifferent.watch");d?.set(score?.total ?? 0,forKey:"score");d?.set(score?.level ?? "NORMAL",forKey:"level");d?.set(workout?.title ?? "REGENERATION",forKey:"workout")
  }
}

@main
struct BeDifferentWatchApp:App{
 @StateObject private var model=WatchModel()
 var body:some Scene{WindowGroup{RootView().environmentObject(model)}}
}

struct RootView:View{
 @EnvironmentObject var model:WatchModel
 @State private var code=""
 var body:some View{
  if model.paired{DashboardView().environmentObject(model)}
  else{ScrollView{VStack(spacing:10){Text("BE DIFFERENT").font(.caption2).fontWeight(.black).foregroundStyle(.green);Text("WATCH KOPPELN").font(.headline);TextField("123456",text:$code).textContentType(.oneTimeCode).multilineTextAlignment(.center);Button(model.pairing ? "KOPPLE…" : "KOPPELN"){Task{await model.pair(code:code)}}.disabled(model.pairing);if let e=model.error{Text(e).font(.caption2).foregroundStyle(.red)}}.padding()}}
 }
}

struct DashboardView:View{
 @EnvironmentObject var model:WatchModel
 var body:some View{
  TabView{
   ScrollView{VStack(alignment:.leading,spacing:8){Text("BE DIFFERENT").font(.caption2).fontWeight(.black).foregroundStyle(.green);Text("\(model.score?.total ?? 0)%").font(.system(size:42,weight:.black));Text(model.score?.level ?? "NORMAL").font(.caption2).fontWeight(.bold);if let e=model.error{Text(e).font(.caption2).foregroundStyle(.red)};Button("AKTUALISIEREN"){Task{await model.refresh()}}}.padding()}.tag(0)
   WorkoutView().environmentObject(model).tag(1)
   ScrollView{VStack{Button("TRENNEN",role:.destructive){model.logout()}}.padding()}.tag(2)
  }.tabViewStyle(.verticalPage).task{await model.refresh()}
 }
}

struct WorkoutView:View{
 @EnvironmentObject var model:WatchModel
 var body:some View{
  ScrollView{
   if let w=model.workout{
    VStack(alignment:.leading,spacing:9){
     Text("TRAINING").font(.caption2).foregroundStyle(.green)
     Text(w.title).font(.headline)
     if let ex=w.exercises.first(where:{$0.completed<$0.sets}){
      Text(ex.name).font(.body).fontWeight(.bold)
      Text("SATZ \(model.setNumber) VON \(ex.sets)").font(.caption2).foregroundStyle(.secondary)
      Stepper("WDH \(model.reps)",value:$model.reps,in:0...100)
      Stepper(String(format:"%.1f KG",model.weight),value:$model.weight,in:0...300,step:2.5)
      Stepper("RPE \(model.rpe)",value:$model.rpe,in:1...10)
      Button("SATZ SPEICHERN"){Task{await model.logSet(exercise:ex)}}.tint(.green)
     }else{
      Text("ALLE SÄTZE ERLEDIGT").font(.caption).fontWeight(.bold)
      Stepper("RPE \(model.rpe)",value:$model.rpe,in:1...10)
      Button("TRAINING ABSCHLIESSEN"){Task{await model.completeWorkout()}}.tint(.green)
     }
    }.padding()
   }else{VStack(spacing:8){Text("HEUTE").font(.caption2).foregroundStyle(.green);Text("REGENERATION").font(.headline);Text("Erholung gehört zum Training.").font(.caption)}.padding()}
  }
 }
}
