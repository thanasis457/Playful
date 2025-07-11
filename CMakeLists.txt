cmake_minimum_required(VERSION 3.15)
set (CMAKE_CXX_STANDARD 11)
project(MediaSubscriber)

# Include Node.js headers and libraries
include_directories(${CMAKE_JS_INC})
include_directories(${CMAKE_BINARY_DIR})
execute_process(COMMAND node -e "require('nan')" OUTPUT_VARIABLE NAN_DIR OUTPUT_STRIP_TRAILING_WHITESPACE)
include_directories(${NAN_DIR})

# Add source files
file(GLOB SOURCE_FILES "mediaMiddleman.cc")

# Add shared library
add_library(${PROJECT_NAME} SHARED ${SOURCE_FILES})

# Link libraries
target_link_libraries(${PROJECT_NAME} ${CMAKE_JS_LIB})
target_link_libraries(${PROJECT_NAME} ${CMAKE_SOURCE_DIR}/libMediaSubscriber.dylib)

# Set compiler options for macOS
if(${CMAKE_SYSTEM_NAME} MATCHES "Darwin")
    target_compile_options(${PROJECT_NAME} PRIVATE -fvisibility=hidden)
    set_target_properties(${PROJECT_NAME} PROPERTIES XCODE_ATTRIBUTE_GCC_SYMBOLS_PRIVATE_EXTERN "YES")
endif()

# Link Node.js addon API
execute_process(COMMAND node -p "require('node-addon-api').targets" OUTPUT_VARIABLE NODE_ADDON_API_INCLUDE_DIR OUTPUT_STRIP_TRAILING_WHITESPACE)
# execute_process(COMMAND node -p "require('node-addon-api').include_dir" OUTPUT_VARIABLE NODE_ADDON_API_INCLUDE_DIR2 OUTPUT_STRIP_TRAILING_WHITESPACE)
include_directories(${NODE_ADDON_API_INCLUDE_DIR})
include_directories(${NODE_ADDON_API_INCLUDE_DIR2})
add_definitions(-DNODE_ADDON_API_DISABLE_DEPRECATED)

# Ensure correct output directory and RPATH settings
set_target_properties(${PROJECT_NAME} PROPERTIES
    LIBRARY_OUTPUT_DIRECTORY ${CMAKE_BINARY_DIR}
    PREFIX "" SUFFIX ".node"
)
# Copy the dynamic library to the output directory
add_custom_command(TARGET ${PROJECT_NAME} POST_BUILD
    COMMAND ${CMAKE_COMMAND} -E copy
    ${CMAKE_SOURCE_DIR}/libMediaSubscriber.dylib
    ${CMAKE_BINARY_DIR}/libMediaSubscriber.dylib
    COMMENT "Coppying lib"
)

# SUPER IMPORTANT. TOOK HOURS TO FIGURE OUT

set(SWIFT_SOURCES ${CMAKE_SOURCE_DIR}/mediaSubscriber.swift)
set(SWIFT_OUTPUT ${CMAKE_SOURCE_DIR}/libMediaSubscriber.dylib)
add_custom_command(
    OUTPUT ${SWIFT_OUTPUT}
    COMMAND swiftc -emit-library -target arm64-apple-macosx14.0 ${SWIFT_SOURCES} -o ${SWIFT_OUTPUT}
    DEPENDS ${SWIFT_SOURCES}
    COMMENT "Compiling Swift code"
)
    
add_custom_target(SwiftCode ALL DEPENDS ${SWIFT_OUTPUT})
    
add_dependencies(${PROJECT_NAME} SwiftCode)

add_custom_command(TARGET ${PROJECT_NAME} POST_BUILD
    COMMAND ${CMAKE_INSTALL_NAME_TOOL} -change ${SWIFT_OUTPUT} "@loader_path/libMediaSubscriber.dylib" MediaSubscriber.node
    COMMENT "Changing deps"
)


message("NAN_DIR: ${NAN_DIR}")
message("NODE_ADDON_API_INCLUDE_DIR: ${NODE_ADDON_API_INCLUDE_DIR}")
message("CMAKE_JS_INC: ${CMAKE_JS_INC}")
message("CMAKE_BINARY_DIR: ${CMAKE_BINARY_DIR}")
