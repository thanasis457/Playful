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


struct Song {
    var name: String;
    var artist: String;
    init(Name: String, Artist: String){
        name = Name
        artist = Artist
    };
};

public typealias Ccallback = @convention(c)(UnsafePointer<CChar>, UnsafePointer<CChar>, UnsafePointer<CChar>) -> Void

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
        print("Subscribed swift")
    }

    @objc
    func nowPlayingInfoChanged(notification: NSNotification) {
        print("In playing swift")
        if let userInfo = notification.userInfo{
            print(userInfo)
            if let name: Any = userInfo["Name"] {
                if let artist: Any = userInfo["Artist"]{
                    if let trackID: Any = userInfo["Track ID"]{
                        print(name as! String, artist as! String, trackID as! String, "swift")
                        cb(name as! String, artist as! String, trackID as! String)
                    }
                }
            }
        }
        // var play: String = notification.userInfo["Player State"] as! String
    }
    
    private func helper(name: String, artist: String){
        let song: Song = Song(Name: name, Artist: artist)
    }

    deinit {
        print("In deinit swift")
        DistributedNotificationCenter.default().removeObserver(self)
    }
}
var o: (any ObservableObject)? = nil;
@_cdecl("startSubscriber")
public func startSubscriber(cb: Ccallback){
    print("In swift subscriber")
    o = NowPlayingSubscriber(callback: cb)
    print("Setting up loop swift")
    // cb("Hello", "World")
    RunLoop.main.run()
    print("Set up")
}
