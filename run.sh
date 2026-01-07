echo "Buidling swift media listener library..."
# Compile library for both architectures
swiftc -emit-library lib/swift/MediaSubscriber.swift -o lib/swift/libMediaSubscriber_intel.dylib -target x86_64-apple-macosx11.0
swiftc -emit-library lib/swift/MediaSubscriber.swift -o lib/swift/libMediaSubscriber_apple_silicon.dylib -target arm64-apple-macosx11.0
# Change the install name to @rpath so we can later use relative path
install_name_tool -id @rpath/libMediaSubscriber.dylib lib/swift/libMediaSubscriber_intel.dylib
install_name_tool -id @rpath/libMediaSubscriber.dylib lib/swift/libMediaSubscriber_apple_silicon.dylib

# Create fat binary of both archs
lipo -create -output lib/swift/libMediaSubscriber.dylib lib/swift/libMediaSubscriber_intel.dylib lib/swift/libMediaSubscriber_apple_silicon.dylib

echo "Buidling C broker to bridge media listener with Dart..."
# Compile for both architectures
g++ -c -fpic lib/swift/MediaMiddleman.cpp -o lib/swift/MediaMiddleman_intel.o -target x86_64-apple-macosx11.0
g++ -c -fpic lib/swift/MediaMiddleman.cpp -o lib/swift/MediaMiddleman_apple_silicon.o -target arm64-apple-macosx11.0
# Create separate shared libraries
g++ -shared lib/swift/MediaMiddleman_intel.o -lMediaSubscriber -L./lib/swift -o lib/swift/libMediaMiddleman_intel.dylib -target x86_64-apple-macosx11.0
g++ -shared lib/swift/MediaMiddleman_apple_silicon.o -lMediaSubscriber -L./lib/swift -o lib/swift/libMediaMiddleman_apple_silicon.dylib -target arm64-apple-macosx11.0
# Change install name (useless here since dart expects exlicit loading of libraries from known relative locations)
install_name_tool -id @rpath/libMediaMiddleman.dylib lib/swift/libMediaMiddleman_intel.dylib
install_name_tool -id @rpath/libMediaMiddleman.dylib lib/swift/libMediaMiddleman_apple_silicon.dylib
# Specify @loader_path for rpath to correctly locate libMediaSubscriber
install_name_tool -add_rpath @loader_path lib/swift/libMediaMiddleman_intel.dylib
install_name_tool -add_rpath @loader_path lib/swift/libMediaMiddleman_apple_silicon.dylib

# Create fat binary for both archs
lipo -create -output lib/swift/libMediaMiddleman.dylib lib/swift/libMediaMiddleman_intel.dylib lib/swift/libMediaMiddleman_apple_silicon.dylib

echo "Removing temporary files..."
rm lib/swift/libMediaSubscriber_intel.dylib
rm lib/swift/libMediaSubscriber_apple_silicon.dylib
rm lib/swift/MediaMiddleman_intel.o
rm lib/swift/MediaMiddleman_apple_silicon.o
rm lib/swift/libMediaMiddleman_intel.dylib
rm lib/swift/libMediaMiddleman_apple_silicon.dylib

echo "Attaching shared libraries to Xcode project..."
cp lib/swift/libMediaSubscriber.dylib macos/
cp lib/swift/libMediaMiddleman.dylib macos/

echo "Running app..."
flutter run -d macos
