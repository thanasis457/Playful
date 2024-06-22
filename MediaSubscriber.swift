//
//  File.swift
//  MusicEmitter
//
//  Created by Thanasis Taprantzis on 6/12/24.
//

//  MusicEmitterApp.swift
//  MusicEmitter
//
//  Created by Thanasis Taprantzis on 6/10/24.
//

import Foundation
import Darwin.C

public typealias Ccallback = @convention(c)(UnsafePointer<CChar>, UnsafePointer<CChar>, UnsafePointer<CChar>, CBool) -> Void

class NowPlayingSubscriber: ObservableObject {
    var cb: Ccallback;
    
    init(callback: Ccallback) {
        cb = callback;
        subscribeToNowPlayingChanges()
    }

    func subscribeToNowPlayingChanges() {
        let notificationCenter = DistributedNotificationCenter.default()
        
        notificationCenter.addObserver(self,
                                       selector: #selector(nowPlayingInfoChanged),
                                       name: NSNotification.Name("com.spotify.client.PlaybackStateChanged"),
                                       object: nil)
    }

    @objc
    func nowPlayingInfoChanged(notification: NSNotification) {
        if let userInfo = notification.userInfo{
            if let name: Any = userInfo["Name"] {
                if let artist: Any = userInfo["Artist"] {
                    if let trackID: Any = userInfo["Track ID"] {
                        if let playing: Any = userInfo["Player State"] {
                        cb(name as! String, artist as! String, trackID as! String, playing as! String == "Playing")
                        }
                    }
                }
            }
        }
        // var play: String = notification.userInfo["Player State"] as! String
    }

    deinit {
        DistributedNotificationCenter.default().removeObserver(self)
    }
}
var o: (any ObservableObject)? = nil;
@_cdecl("startSubscriber")
public func startSubscriber(cb: Ccallback){
    o = NowPlayingSubscriber(callback: cb)
    // cb("Hello", "World")
    RunLoop.main.run()
}
