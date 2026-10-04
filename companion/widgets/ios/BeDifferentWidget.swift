import WidgetKit
import SwiftUI

struct BeDifferentEntry: TimelineEntry {
    let date: Date
    let score: Int
    let level: String
    let workout: String
}
struct Provider: TimelineProvider {
    func placeholder(in context: Context) -> BeDifferentEntry { .init(date: .now, score: 81, level: "BE DIFFERENT", workout: "HEUTIGES TRAINING") }
    func getSnapshot(in context: Context, completion: @escaping (BeDifferentEntry) -> Void) { completion(placeholder(in: context)) }
    func getTimeline(in context: Context, completion: @escaping (Timeline<BeDifferentEntry>) -> Void) {
        let shared=UserDefaults(suiteName: "group.com.smarbiz.bedifferent")
        let entry=BeDifferentEntry(date:.now,score:shared?.integer(forKey:"score") ?? 0,level:shared?.string(forKey:"level") ?? "NORMAL",workout:shared?.string(forKey:"workout") ?? "REGENERATION")
        completion(Timeline(entries:[entry],policy:.after(Date().addingTimeInterval(1800))))
    }
}
struct BeDifferentWidgetView: View {
    var entry: Provider.Entry
    var body: some View {
        ZStack {
            Color.black
            VStack(alignment:.leading,spacing:5) {
                Text("BE DIFFERENT").font(.caption2).fontWeight(.black).foregroundStyle(Color(red:0.83,green:1,blue:0))
                Text("\(entry.score)%").font(.system(size:38,weight:.black)).foregroundStyle(.white)
                Text(entry.level).font(.caption2).fontWeight(.bold).foregroundStyle(Color(red:0.83,green:1,blue:0))
                Spacer()
                Text(entry.workout).font(.caption2).fontWeight(.bold).foregroundStyle(.white).lineLimit(2)
            }.padding()
        }
    }
}
@main
struct BeDifferentWidget: Widget {
    var body: some WidgetConfiguration {
        StaticConfiguration(kind:"BeDifferentWidget",provider:Provider()){ entry in BeDifferentWidgetView(entry:entry) }
            .configurationDisplayName("BE DIFFERENT")
            .description("Score und heutiges Training")
            .supportedFamilies([.systemSmall,.systemMedium])
    }
}
