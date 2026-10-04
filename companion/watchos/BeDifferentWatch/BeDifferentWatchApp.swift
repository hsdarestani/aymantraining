import SwiftUI

@main
struct BeDifferentWatchApp: App {
    @StateObject private var model = WatchModel()
    var body: some Scene {
        WindowGroup {
            ContentView().environmentObject(model)
        }
    }
}

struct CompanionResponse: Codable {
    let ok: Bool
    let score: Score?
    let workout: Workout?
}
struct Score: Codable { let total: Int; let level: String; let recovery: Int?; let completeness: Int }
struct Workout: Codable { let id: String; let title: String; let scheduledAt: String?; let exercises: [Exercise] }
struct Exercise: Codable { let name: String; let sets: Int; let reps: String? }

@MainActor
final class WatchModel: ObservableObject {
    @Published var score: Score?
    @Published var workout: Workout?
    @Published var error: String?
    var token: String = ""

    func refresh() async {
        guard !token.isEmpty else { error = "Bitte zuerst auf dem iPhone anmelden."; return }
        var request = URLRequest(url: URL(string: "https://bedifferent.smarbiz.sbs/api/companion")!)
        request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        request.setValue("watch", forHTTPHeaderField: "x-bd-client")
        do {
            let (data, response) = try await URLSession.shared.data(for: request)
            guard (response as? HTTPURLResponse)?.statusCode == 200 else { throw URLError(.badServerResponse) }
            let decoded = try JSONDecoder().decode(CompanionResponse.self, from: data)
            score = decoded.score; workout = decoded.workout; error = nil
        } catch { self.error = "Daten konnten nicht geladen werden." }
    }
}

struct ContentView: View {
    @EnvironmentObject var model: WatchModel
    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 10) {
                Text("BE DIFFERENT").font(.caption2).foregroundStyle(.green)
                Text("\(model.score?.total ?? 0)%").font(.system(size: 42, weight: .black))
                Text(model.score?.level ?? "NORMAL").font(.caption).fontWeight(.bold)
                if let workout = model.workout {
                    Divider()
                    Text("HEUTE").font(.caption2).foregroundStyle(.secondary)
                    Text(workout.title).font(.headline)
                    ForEach(Array(workout.exercises.prefix(4).enumerated()), id: \.offset) { _, exercise in
                        Text("\(exercise.name) · \(exercise.sets) Sätze").font(.caption2)
                    }
                } else {
                    Text("Heute bewusst regenerieren.").font(.caption)
                }
                if let error = model.error { Text(error).font(.caption2).foregroundStyle(.red) }
                Button("AKTUALISIEREN") { Task { await model.refresh() } }
            }.padding()
        }.task { await model.refresh() }
    }
}
