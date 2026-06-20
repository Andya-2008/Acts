import SwiftUI
import WidgetKit

private let brand = Color(red: 0.98, green: 0.35, blue: 0.53)
private let ink = Color(red: 0.10, green: 0.10, blue: 0.10)
private let inkSecondary = Color(red: 0.22, green: 0.25, blue: 0.28)
private let green = Color(red: 0.12, green: 0.48, blue: 0.33)
private let surface = Color(red: 1.0, green: 1.0, blue: 1.0)
private let surfaceDark = Color(red: 0.11, green: 0.11, blue: 0.12)
private let inkDark = Color(red: 0.95, green: 0.95, blue: 0.97)
private let inkSecondaryDark = Color(red: 0.78, green: 0.80, blue: 0.84)

private struct WidgetSurfaceBackground: View {
    @Environment(\.colorScheme) private var colorScheme

    var body: some View {
        colorScheme == .dark ? surfaceDark : surface
    }
}

private func tasksDeepLink(taskId: String? = nil) -> URL {
    var path = "acts:///(app)/(tabs)/tasks"
    if let id = taskId?.trimmingCharacters(in: .whitespacesAndNewlines), !id.isEmpty {
        let encoded = id.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? id
        path += "?taskId=\(encoded)"
    }
    return URL(string: path) ?? URL(string: "acts:///(app)/(tabs)/tasks")!
}

struct ActsHomeWidgetEntry: TimelineEntry {
    let date: Date
    let snapshot: WidgetSnapshot
}

struct ActsHomeWidgetProvider: TimelineProvider {
    func placeholder(in context: Context) -> ActsHomeWidgetEntry {
        ActsHomeWidgetEntry(date: Date(), snapshot: WidgetDataStore.placeholder())
    }

    func getSnapshot(in context: Context, completion: @escaping (ActsHomeWidgetEntry) -> Void) {
        let snapshot = WidgetDataStore.load() ?? WidgetDataStore.placeholder()
        completion(ActsHomeWidgetEntry(date: Date(), snapshot: snapshot))
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<ActsHomeWidgetEntry>) -> Void) {
        let snapshot = WidgetDataStore.load() ?? WidgetDataStore.placeholder()
        let entry = ActsHomeWidgetEntry(date: Date(), snapshot: snapshot)
        let nextUpdate = Calendar.current.date(byAdding: .minute, value: 30, to: Date()) ?? Date().addingTimeInterval(1800)
        completion(Timeline(entries: [entry], policy: .after(nextUpdate)))
    }
}

struct ActsHomeWidgetEntryView: View {
    @Environment(\.widgetFamily) private var family
    @Environment(\.colorScheme) private var colorScheme
    var entry: ActsHomeWidgetProvider.Entry

    private var primaryText: Color {
        colorScheme == .dark ? inkDark : ink
    }

    private var secondaryText: Color {
        colorScheme == .dark ? inkSecondaryDark : inkSecondary
    }

    var body: some View {
        switch family {
        case .systemMedium:
            mediumView
        default:
            smallView
        }
    }

    private var smallView: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text("Acts")
                .font(.caption.weight(.bold))
                .foregroundStyle(brand)

            Spacer(minLength: 0)

            Text("\(entry.snapshot.streak)")
                .font(.system(size: 36, weight: .bold, design: .rounded))
                .foregroundStyle(green)
                .minimumScaleFactor(0.7)
                .lineLimit(1)

            Text(entry.snapshot.streak == 1 ? "day streak" : "day streak")
                .font(.caption2)
                .foregroundStyle(secondaryText)

            Spacer(minLength: 0)

            Text(subtitle)
                .font(.caption2)
                .foregroundStyle(secondaryText)
                .lineLimit(2)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .leading)
        .padding(12)
        .widgetURL(tasksDeepLink())
    }

    @ViewBuilder
    private func taskRow(_ task: WidgetSnapshot.TaskItem) -> some View {
        if #available(iOS 17.0, *) {
            Link(destination: tasksDeepLink(taskId: task.id)) {
                Text("• \(task.title)")
                    .font(.subheadline)
                    .foregroundStyle(primaryText)
                    .lineLimit(1)
            }
        } else {
            Text("• \(task.title)")
                .font(.subheadline)
                .foregroundStyle(primaryText)
                .lineLimit(1)
        }
    }

    private var mediumView: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Text("Acts")
                    .font(.caption.weight(.bold))
                    .foregroundStyle(brand)
                Spacer()
                Text("\(entry.snapshot.streak)d streak")
                    .font(.caption.weight(.semibold))
                    .foregroundStyle(green)
            }

            if entry.snapshot.tasks.isEmpty {
                Spacer(minLength: 0)
                Text(entry.snapshot.completedToday ? "All done today!" : "Open Acts to see your list")
                    .font(.subheadline.weight(.semibold))
                    .foregroundStyle(primaryText)
                    .lineLimit(2)
                Spacer(minLength: 0)
            } else {
                VStack(alignment: .leading, spacing: 6) {
                    ForEach(entry.snapshot.tasks.prefix(3), id: \.id) { task in
                        taskRow(task)
                    }
                }
                Spacer(minLength: 0)
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .leading)
        .padding(12)
        .widgetURL(tasksDeepLink())
    }

    private var subtitle: String {
        if entry.snapshot.completedToday {
            return "Done for today"
        }
        if entry.snapshot.openTaskCount == 0 {
            return "Add an act in Acts"
        }
        if entry.snapshot.openTaskCount == 1 {
            return "1 act waiting"
        }
        return "\(entry.snapshot.openTaskCount) acts waiting"
    }
}

struct ActsHomeWidget: Widget {
    let kind: String = "ActsHomeWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: ActsHomeWidgetProvider()) { entry in
            if #available(iOS 17.0, *) {
                ActsHomeWidgetEntryView(entry: entry)
                    .containerBackground(for: .widget) {
                        WidgetSurfaceBackground()
                    }
            } else {
                ActsHomeWidgetEntryView(entry: entry)
                    .background(WidgetSurfaceBackground())
            }
        }
        .configurationDisplayName("Acts")
        .description("Your streak and suggested acts.")
        .supportedFamilies([.systemSmall, .systemMedium])
    }
}
