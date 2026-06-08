import Foundation

struct WidgetSnapshot: Codable {
    struct TaskItem: Codable {
        let id: String
        let title: String
    }

    let streak: Int
    let completedToday: Bool
    let openTaskCount: Int
    let tasks: [TaskItem]
    let updatedAt: String
}

enum WidgetDataStore {
    static let suiteName = "group.com.FrogCOO.Acts.expowidgets"
    static let dataKey = "ActsWidgetData"

    static func load() -> WidgetSnapshot? {
        guard
            let defaults = UserDefaults(suiteName: suiteName),
            let json = defaults.string(forKey: dataKey),
            let data = json.data(using: .utf8)
        else {
            return nil
        }
        return try? JSONDecoder().decode(WidgetSnapshot.self, from: data)
    }

    static func placeholder() -> WidgetSnapshot {
        WidgetSnapshot(
            streak: 0,
            completedToday: false,
            openTaskCount: 0,
            tasks: [],
            updatedAt: ISO8601DateFormatter().string(from: Date())
        )
    }
}
