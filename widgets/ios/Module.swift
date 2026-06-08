import ExpoModulesCore
import WidgetKit

public class ExpoWidgetsModule: Module {
    public func definition() -> ModuleDefinition {
        Name("ExpoWidgets")

        Function("setWidgetData") { (data: String) -> Void in
            let suiteName = "group.com.FrogCOO.Acts.expowidgets"
            let widgetSuite = UserDefaults(suiteName: suiteName)
            widgetSuite?.set(data, forKey: "ActsWidgetData")

            if #available(iOS 14.0, *) {
                WidgetCenter.shared.reloadAllTimelines()
            }
        }
    }
}
