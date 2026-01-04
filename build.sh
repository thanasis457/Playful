echo "Buidling swift media listener library..."
swiftc -emit-library lib/swift/MediaSubscriber.swift -o lib/swift/libMediaSubscriber.dylib

echo "Buidling C broker to bridge media listener with Dart..."
g++ -c -fpic lib/swift/MediaMiddleman.cpp -o lib/swift/MediaMiddleman.o
g++ -shared lib/swift/MediaMiddleman.o -lMediaSubscriber -L./lib/swift -o lib/swift/libMediaMiddleman.dylib

install_name_tool -change lib/swift/libMediaSubscriber.dylib @rpath/libMediaSubscriber.dylib lib/swift/libMediaMiddleman.dylib
install_name_tool -add_rpath @loader_path lib/swift/libMediaMiddleman.dylib

echo "Adding to Xcode..."
cp lib/swift/MediaSubscriber.dylib macos/
cp lib/swift/MediaMiddleman.dylib macos/

echo "Running app..."
flutter build macos --release
