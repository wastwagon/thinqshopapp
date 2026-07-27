//  OnlineAppCreator.com
//  WebViewGold for iOS // webviewgold.com

/* PLEASE CHECK CONFIG.SWIFT FOR CONFIGURATION */
/* PLEASE CHECK CONFIG.SWIFT FOR CONFIGURATION */
/* PLEASE CHECK CONFIG.SWIFT FOR CONFIGURATION */

import UIKit
import UserNotifications
import CoreLocation
import SwiftyStoreKit
import AVFoundation
import EventKit
import OneSignal


class LocationManager: NSObject, CLLocationManagerDelegate {
    static let shared = LocationManager()
    let locationManager = CLLocationManager()

    override init() {
        super.init()
        if Constants.backgroundlocation{
        locationManager.delegate = self
        locationManager.allowsBackgroundLocationUpdates = true
        locationManager.pausesLocationUpdatesAutomatically = false
        locationManager.requestAlwaysAuthorization()
        }
    }

    func locationManager(_ manager: CLLocationManager, didChangeAuthorization status: CLAuthorizationStatus) {
        if status == .authorizedAlways || status == .authorizedWhenInUse {
            manager.startUpdatingLocation()
        }
    }

    func locationManager(_ manager: CLLocationManager, didUpdateLocations locations: [CLLocation]) {
        guard let location = locations.last else { return }
        // Send location to WebView via notification
        NotificationCenter.default.post(name: NSNotification.Name("LocationUpdate"), object: location)
    }
}

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate {
    
    var isActive = false
    var orientationLock = UIInterfaceOrientationMask.all
    func application(_ application: UIApplication, supportedInterfaceOrientationsFor window: UIWindow?) -> UIInterfaceOrientationMask {
        let idiom = UIDevice.current.userInterfaceIdiom
        let orientation = idiom == .pad ? orientationipad : orientationiphone
        
        switch orientation {
        case "portrait":
            orientationLock = .portrait
        case "landscape":
            orientationLock = .landscape
        default:
            orientationLock = .all
        }
        return self.orientationLock
    }

    struct AppUtility {
        static func lockOrientation(_ orientation: UIInterfaceOrientationMask) {
            if let delegate = UIApplication.shared.delegate as? AppDelegate {
                delegate.orientationLock = orientation
            }
        }

        static func lockOrientation(_ orientation: UIInterfaceOrientationMask, andRotateTo rotateOrientation:UIInterfaceOrientation) {
            self.lockOrientation(orientation)
            UIDevice.current.setValue(rotateOrientation.rawValue, forKey: "orientation")
        }
    }
    
    var window: UIWindow?
    
    func application(_ application: UIApplication, willFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey : Any]? = nil) -> Bool {
        // Avoid dark-mode systemBackground flash between launch screen and splash
        if #available(iOS 13.0, *) {
            if darkModeStatusBarTextColor == "black" {
                if let window = window {
                    window.overrideUserInterfaceStyle = .light
                }
                UIApplication.shared.windows.forEach { $0.overrideUserInterfaceStyle = .light }
            }
        }
        return true
    }

    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        if #available(iOS 13.0, *) {
            if darkModeStatusBarTextColor == "black" {
                window?.overrideUserInterfaceStyle = .light
                deactivatedarkmode()
            }
        }
        
        if Constants.backgroundlocation{
            LocationManager.shared // Initialize location manager
        }
        
        NotificationCenter.default.addObserver(self, selector: #selector(appWillEnterForeground), name: UIApplication.willEnterForegroundNotification, object: nil)
        
        UIApplication.shared.applicationIconBadgeNumber = 0
        
        //handle Universal Link
           if let url = launchOptions?[.url] as? URL {
               handleUniversalLink(url)
           }
        
        
        //handle terminate notification
        if let option = launchOptions {
            let info = option[UIApplication.LaunchOptionsKey.remoteNotification]
            if (info != nil) {
                if let dict = info as? NSDictionary {
                    if let x = dict.value(forKey: "custom") as? NSDictionary {
                        if let y = x.value(forKey: "a") as? NSDictionary{
                            if y.value(forKey: "url") as? String ?? "" != "" {
                                let noti_url = y.value(forKey: "url") as? String ?? ""
                                UserDefaults.standard.set(noti_url, forKey: "Noti_Url")
                                UserDefaults.standard.set(true, forKey: "isFromPush")
                            }
                        }
                        else{
                            UserDefaults.standard.set(nil, forKey: "Noti_Url")
                            UserDefaults.standard.set(false, forKey: "isFromPush")
                        }
                    }
                }
            }
        }
        
        
        SwiftyStoreKit.completeTransactions(atomically: true) { purchases in
            for purchase in purchases {
                switch purchase.transaction.transactionState {
                case .purchased, .restored:
                    if purchase.needsFinishTransaction {
                        SwiftyStoreKit.finishTransaction(purchase.transaction)
                    }
                case .failed, .purchasing, .deferred:
                    break 
                @unknown default:
                    break 
                }
            }
        }
        
        if UserDefaults.standard.value(forKey: "IsPurchase") == nil
        {
            UserDefaults.standard.setValue("NO", forKey: "IsPurchase")
        }

        if Constants.kPushEnabled {
            OneSignal.initWithLaunchOptions(launchOptions)
            OneSignal.setAppId(Constants.oneSignalID)
            OneSignal.setLaunchURLsInApp(false)

            let notifWillShowInForegroundHandler: OSNotificationWillShowInForegroundBlock = { notification, completion in
                if notification.notificationId == "example_silent_notif" {
                    completion(nil)
                } else {
                    completion(notification)
                }
            }

            let notificationOpenedBlock: OSNotificationOpenedBlock = { result in
                let notification: OSNotification = result.notification
                if let additionalData = notification.additionalData {
                    if let url = additionalData["url"] as? String {
                        UserDefaults.standard.set(url, forKey: "Noti_Url")
                        UserDefaults.standard.set(true, forKey: "isFromPush")
                        NotificationCenter.default.post(name: NSNotification.Name(rawValue: "OpenWithNotificationURL"), object: nil, userInfo: nil)
                    }
                }
            }

            OneSignal.setNotificationOpenedHandler(notificationOpenedBlock)
            OneSignal.setNotificationWillShowInForegroundHandler(notifWillShowInForegroundHandler)
        }
        
        if askforpushpermissionatfirstrun {
            registerForPushNotifications(application: application)
        }
        
        return true
    }
    
    func requestCalendarPermissions() {
        let eventStore = EKEventStore()

        eventStore.requestAccess(to: .event) { (granted, error) in
            if let error = error {
                print("Error requesting calendar access: \(error.localizedDescription)")
                return
            }

            if granted {
                print("Calendar access granted.")
            } else {
                print("Calendar access denied.")
            }
        }
    }

    func deactivatedarkmode() {
        if #available(iOS 13.0, *) {
            window?.overrideUserInterfaceStyle = .light
        }
    }
    
    func application(_ application: UIApplication,
                     continue userActivity: NSUserActivity,
                     restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void) -> Bool {
        guard userActivity.activityType == NSUserActivityTypeBrowsingWeb,
              let webpageURL = userActivity.webpageURL else {
            return false
        }
        print("Coming back from background: Universal Link triggered")
        if Constants.backgroundlocation{
            if let location = LocationManager.shared.locationManager.location {
                print("Location updated");
            }
        }
        handleUniversalLink(webpageURL)
        return true
    }

    
    
    private func handleUniversalLink(_ url: URL) { //Universal Links API
        if ShowExternalLink{
        if let urlToOpen = url.absoluteString.removingPercentEncoding {
            webviewurl = urlToOpen
                
            UserDefaults.standard.set(webviewurl, forKey: "DeepLinkUrl-applinkstype")
            NotificationCenter.default.post(name: NSNotification.Name(rawValue: "OpenWithExternalLink"), object: nil, userInfo: nil)
        }
        }
    }
    
    
    func application(_ application: UIApplication,
                     open url: URL,
                     options: [UIApplication.OpenURLOptionsKey : Any] = [:] ) -> Bool {
        
        let deepLink = url.absoluteString
        
        // Check if the URL contains "?link=" (required for Deep Linking API)
        guard deepLink.contains("?link=") else {
            
            if let deepLink = userActivity?.webpageURL {
                handleUniversalLink(deepLink) //Go for Universal Links API as Fallback instead of Deep Linking API
              
            }
            
            return false
        }

        // Collect the deep link URL after "scheme://url?link="
        if let index = deepLink.firstIndex(of: "=") {
            let sliceIndex = deepLink.index(after: index)
            let deepLinkURL: String = String(deepLink[sliceIndex...])
            
            // Collect the deep link URL host
            var deepLinkURLHost = deepLinkURL.replacingOccurrences(of: "www.", with: "")
            deepLinkURLHost = deepLinkURLHost.replacingOccurrences(of: "https://", with: "")
            deepLinkURLHost = deepLinkURLHost.replacingOccurrences(of: "http://", with: "")
            
            host = deepLinkURLHost
            webviewurl = deepLinkURL

            if ShowExternalLink{
                UserDefaults.standard.set(deepLinkURL, forKey: "DeepLinkUrl")
                NotificationCenter.default.post(name: NSNotification.Name(rawValue: "OpenWithExternalLink"), object: nil, userInfo: nil)
            }
            return true
        } else {
            print("URL missing")
            return false
        }
    }
    
    func applicationWillResignActive(_ application: UIApplication) {
    }
    
    func applicationDidEnterBackground(_ application: UIApplication) {


    if Constants.backgroundlocation{
            if let location = LocationManager.shared.locationManager.location {
                print("Location updated");
            }
    }
    do {
    if #available(iOS 11.0, *) {
    try AVAudioSession.sharedInstance().setCategory(.playback, mode: .default, policy: .longForm, options: [.mixWithOthers, .allowAirPlay])
    } else {
    }
    try AVAudioSession.sharedInstance().setActive(true)
    } catch {
    print(error)
    }

    }
    
    func applicationWillEnterForeground(_ application: UIApplication) {
    }
    
    func applicationWillTerminate(_ application: UIApplication) {
        
        if (deletecacheonexit){
            NotificationCenter.default.post(name: NSNotification.Name("ApplicationWillTerminate"), object: nil)
        }
    }
}

extension AppDelegate: UNUserNotificationCenterDelegate {
    func registerForPushNotifications(application: UIApplication)
    {
        if #available(iOS 11.0, *)
        {
            UNUserNotificationCenter.current().delegate = self
            
            let authOptions: UNAuthorizationOptions = [.alert, .badge, .sound]
            UNUserNotificationCenter.current().requestAuthorization(
                options: authOptions,
                completionHandler: {_, _ in })
        }
        else
        {
            let settings: UIUserNotificationSettings =
                UIUserNotificationSettings(types: [.alert, .badge, .sound], categories: nil)
            application.registerUserNotificationSettings(settings)
            print("Notification: registration for iOS < 10 using Basic Notification Center")
        }
        
        application.registerForRemoteNotifications()
    }
    
    func application(_ application: UIApplication, didFailToRegisterForRemoteNotificationsWithError error: Error) {
        print("Notification: Unable to register for remote notifications: \(error.localizedDescription)")
    }
    
    func application(_ application: UIApplication, didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data)
    {
        print("Registered for Remote Notifications with Device Token")
    }
    
    func application(application: UIApplication,
                     didRegisterForRemoteNotificationsWithDeviceToken deviceToken: NSData) {
        
    }
    
    func application(_ application: UIApplication, didReceiveRemoteNotification userInfo: [AnyHashable: Any],
                     fetchCompletionHandler completionHandler: @escaping (UIBackgroundFetchResult) -> Void)
    {
        if let x = userInfo["custom"] as? [AnyHashable: Any] {
            if let y = x["a"] as? [String:String] {
                guard y["url"] != nil else {return}
                let noti_url = y["url"]!
                UserDefaults.standard.set(noti_url, forKey: "Noti_Url")
                UserDefaults.standard.set(true, forKey: "isFromPush")
            }
            else{
                UserDefaults.standard.set(nil, forKey: "Noti_Url")
                UserDefaults.standard.set(false, forKey: "isFromPush")
            }
        }
        else if let urlNotification = userInfo["url"] as? String {
            UserDefaults.standard.set(urlNotification, forKey: "Noti_Url")
            UserDefaults.standard.set(true, forKey: "isFromPush")
        }
        
        let state : UIApplication.State = application.applicationState
        switch state
        {
        case .active:
            print("Application is in Active Mode!")
            if userInfo["custom"] is [AnyHashable: Any] {
                if(self.isActive){
                    DispatchQueue.main.asyncAfter(deadline: .now()+1, execute: {
                        self.isActive = false
                        NotificationCenter.default.post(name: NSNotification.Name(rawValue: "OpenWithNotificationURL"), object: nil, userInfo: nil)
                    })
                }
                else{
                    self.isActive = true
                }
            }
            completionHandler(UIBackgroundFetchResult.newData)
        case .inactive:
            if let x = userInfo["custom"] as? [AnyHashable: Any] {
                if let y = x["a"] as? [String:String] {
                    guard y["url"] != nil else {return}
                    let noti_url = y["url"]!
                    DispatchQueue.main.asyncAfter(deadline: .now() + 1, execute: {
                        UserDefaults.standard.set(noti_url, forKey: "Noti_Url")
                        NotificationCenter.default.post(name: NSNotification.Name(rawValue: "OpenWithNotificationURL"), object: nil, userInfo: nil)
                    })
                }
                else{
                    UserDefaults.standard.set(nil, forKey: "Noti_Url")
                }
            }
            else if let urlNotification = userInfo["url"] as? String {
                UserDefaults.standard.set(urlNotification, forKey: "Noti_Url")
                UserDefaults.standard.set(true, forKey: "isFromPush")
                NotificationCenter.default.post(name: NSNotification.Name(rawValue: "OpenWithNotificationURL"), object: nil, userInfo: nil)
            }
            completionHandler(UIBackgroundFetchResult.newData)
        case .background:
            print("Application is in Backgound mode!")
            completionHandler(UIBackgroundFetchResult.newData)
        @unknown default:
            completionHandler(UIBackgroundFetchResult.newData)
            break
        }
        

    }
    
    //MARK:- Handling local notification when application is in foreground state
    func userNotificationCenter(_ center: UNUserNotificationCenter, willPresent notification: UNNotification, withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void) {
        completionHandler([.alert,.badge,.sound])
    }
    
    //Method to handle the application tap when it is in foreground
    func userNotificationCenter(_ center: UNUserNotificationCenter, didReceive response: UNNotificationResponse, withCompletionHandler completionHandler: @escaping () -> Void) {
        
        let userInfo = response.notification.request.content.userInfo
        if let x = userInfo["custom"] as? [AnyHashable: Any] {
            if let y = x["a"] as? [String:String] {
                guard y["url"] != nil else {return}
                let noti_url = y["url"]!
                DispatchQueue.main.asyncAfter(deadline: .now() + 1, execute: {
                    UserDefaults.standard.set(noti_url, forKey: "Noti_Url")
                    NotificationCenter.default.post(name: NSNotification.Name(rawValue: "OpenWithNotificationURL"), object: nil, userInfo: nil)
                })
            }
            else{
                UserDefaults.standard.set(nil, forKey: "Noti_Url")
            }
        }
        else if let urlNotification = userInfo["url"] as? String {
            UserDefaults.standard.set(urlNotification, forKey: "Noti_Url")
            UserDefaults.standard.set(true, forKey: "isFromPush")
            NotificationCenter.default.post(name: NSNotification.Name(rawValue: "OpenWithNotificationURL"), object: nil, userInfo: nil)
        }
    }
    
    @objc func appWillEnterForeground() {
           // Handle reauthentication here
        if(requireBioMetricAuthForSoftStart) {
            let mainViewController = window?.rootViewController as? SplashscreenVC
            mainViewController?.authenticateUser()
        }
        if Constants.backgroundlocation{
            if let location = LocationManager.shared.locationManager.location {
                print("Location updated");
            }
        }
       }
    
}

