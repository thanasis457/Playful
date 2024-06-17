{
    "targets": [
        {
            "include_dirs": [
                "<!(node -e \"require('nan')\")"
            ],
            "target_name": "MediaSubscriber",
            "sources": [
                "mediaMiddleman.cc"
            ],
            "libraries": [
                "../libMediaSubscriber.dylib"
            ],
            "dependencies": [
                "<!(node -p \"require('node-addon-api').targets\"):node_addon_api"
            ],
            "conditions": [
                [
                    "OS==\"mac\"",
                    {
                        "cflags+": [
                            "-fvisibility=hidden"
                        ],
                        "xcode_settings": {
                            "GCC_SYMBOLS_PRIVATE_EXTERN": "YES"
                        }
                    }
                ]
            ]
        }
    ]
}
