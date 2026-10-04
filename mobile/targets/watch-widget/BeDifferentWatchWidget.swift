import WidgetKit
import SwiftUI

struct WatchEntry:TimelineEntry{let date:Date;let score:Int;let level:String}
struct WatchProvider:TimelineProvider{
 func placeholder(in context:Context)->WatchEntry{.init(date:.now,score:81,level:"BE DIFFERENT")}
 func getSnapshot(in context:Context,completion:@escaping(WatchEntry)->Void){completion(placeholder(in:context))}
 func getTimeline(in context:Context,completion:@escaping(Timeline<WatchEntry>)->Void){
  let d=UserDefaults(suiteName:"group.com.smarbiz.bedifferent.watch")
  let e=WatchEntry(date:.now,score:d?.integer(forKey:"score") ?? 0,level:d?.string(forKey:"level") ?? "NORMAL")
  completion(Timeline(entries:[e],policy:.after(Date().addingTimeInterval(1800))))
 }
}
struct WatchComplicationView:View{
 let entry:WatchEntry
 @Environment(\.widgetFamily)var family
 var body:some View{
  switch family{
  case .accessoryCircular:ZStack{AccessoryWidgetBackground();VStack(spacing:0){Text("\(entry.score)").font(.headline).fontWeight(.black);Text("%").font(.caption2)}}
  case .accessoryRectangular:VStack(alignment:.leading){Text("BE DIFFERENT").font(.caption2).fontWeight(.black);Text("\(entry.score)% · \(entry.level)").font(.headline)}
  default:Text("\(entry.score)%")
  }
 }
}
@main
struct BeDifferentWatchWidget:Widget{
 var body:some WidgetConfiguration{StaticConfiguration(kind:"BeDifferentWatchWidget",provider:WatchProvider()){WatchComplicationView(entry:$0)}.configurationDisplayName("BE DIFFERENT").description("Dein aktueller Leistungswert").supportedFamilies([.accessoryCircular,.accessoryRectangular,.accessoryInline])}
}
