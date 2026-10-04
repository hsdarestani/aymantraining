import WidgetKit
import SwiftUI

struct BeDifferentEntry:TimelineEntry{let date:Date;let score:Int;let level:String;let workout:String}
struct BeDifferentProvider:TimelineProvider{
 func placeholder(in context:Context)->BeDifferentEntry{.init(date:.now,score:81,level:"BE DIFFERENT",workout:"HEUTIGES TRAINING")}
 func getSnapshot(in context:Context,completion:@escaping(BeDifferentEntry)->Void){completion(placeholder(in:context))}
 func getTimeline(in context:Context,completion:@escaping(Timeline<BeDifferentEntry>)->Void){
  let d=UserDefaults(suiteName:"group.com.smarbiz.bedifferent")
  let e=BeDifferentEntry(date:.now,score:d?.integer(forKey:"score") ?? 0,level:d?.string(forKey:"level") ?? "NORMAL",workout:d?.string(forKey:"workout") ?? "REGENERATION")
  completion(Timeline(entries:[e],policy:.after(Date().addingTimeInterval(1800))))
 }
}
struct BeDifferentWidgetView:View{
 let entry:BeDifferentEntry
 var body:some View{
  VStack(alignment:.leading,spacing:5){Text("BE DIFFERENT").font(.caption2).fontWeight(.black).foregroundStyle(Color(red:0.83,green:1,blue:0));Text("\(entry.score)%").font(.system(size:42,weight:.black));Text(entry.level).font(.caption2).fontWeight(.bold).foregroundStyle(Color(red:0.83,green:1,blue:0));Spacer();Text(entry.workout).font(.caption2).fontWeight(.bold).lineLimit(2)}
   .padding().foregroundStyle(.white).containerBackground(Color.black,for:.widget)
 }
}
@main
struct BeDifferentWidget:Widget{
 var body:some WidgetConfiguration{StaticConfiguration(kind:"BeDifferentWidget",provider:BeDifferentProvider()){BeDifferentWidgetView(entry:$0)}.configurationDisplayName("BE DIFFERENT").description("Leistungswert und heutiges Training").supportedFamilies([.systemSmall,.systemMedium])}
}
