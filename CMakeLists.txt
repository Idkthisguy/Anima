cmake_minimum_required(VERSION 3.16)
project(Anima_Pro VERSION 2.0 LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 23)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

include(CheckIPOSupported)
check_ipo_supported(RESULT supported OUTPUT error)

set(PORTABLE_DIR "${CMAKE_BINARY_DIR}/Anima_Portable_Windows")

find_package(Qt6 REQUIRED COMPONENTS Quick QuickControls2 Svg Core QuickEffects)
qt_standard_project_setup(REQUIRES 6.5)

if(WIN32)
    set(EXE_ICON "resources.rc")
endif()

qt_add_executable(appAnima_Pro
    WIN32
    main.cpp
    canvasprovider.cpp
    canvasprovider.h
    Engine/enginemanager.cpp
    Engine/enginemanager.h
    Timeline/timelinemanager.cpp
    Timeline/timelinemanager.h
    FileIO/iomanager.cpp
    FileIO/iomanager.h
    FileIO/anxhandler.cpp
    FileIO/anxhandler.h
    FileIO/animafilehandler.cpp
    FileIO/animafilehandler.h
    FileIO/Export/mp4exporter.cpp
    FileIO/Export/mp4exporter.h

    ${EXE_ICON}
)

qt_add_qml_module(appAnima_Pro
    URI Anima_Pro
    VERSION 2.0
    QML_FILES
        Main.qml
        ui/AppPalette.qml
        ui/AppShortcuts.qml
        ui/Viewport/Toolbar.qml
        ui/Viewport/Viewport.qml
        ui/Viewport/PropertiesPanel.qml
        ui/Dialogs/ColorPickerDialog.qml
        ui/Dialogs/Dialogs.qml
        Timeline/TimelinePanel.qml
    RESOURCES
        assets/icons/play.svg
        assets/icons/stop.svg
        assets/icons/icon.png
        assets/icons/pause.svg
        assets/icons/arrowback.svg
        assets/icons/colorpicker.svg
        assets/icons/brush.svg
        assets/icons/eraser.svg
        assets/icons/bucket.svg
        assets/icons/undo.svg
        assets/icons/redo.svg
    SOURCES

        canvasprovider.h canvasprovider.cpp


        SOURCES Engine/toolHandler.h Engine/toolHandler.cpp
        SOURCES Engine/StrokeMath.h
        fileIO/IOManager.h    fileIO/IOManager.cpp
        SOURCES FileIO/anxhandler.h FileIO/anxhandler.cpp
        SOURCES
        SOURCES Timeline/timelinemanager.h Timeline/timelinemanager.cpp
        Timeline/frameData.h
        SOURCES Engine/enginemanager.h Engine/enginemanager.cpp
        SOURCES FileIO/animafilehandler.h FileIO/animafilehandler.cpp
        SOURCES FileIO/Export/mp4exporter.h FileIO/Export/mp4exporter.cpp
        SOURCES Timeline/frameData.h
        SOURCES FileIO/iomanager.h FileIO/iomanager.cpp

)

set_target_properties(appAnima_Pro PROPERTIES
    OUTPUT_NAME "Anima"
)

if(supported)
    message(STATUS "LTO is supported and enabled!")
    set_target_properties(appAnima_Pro PROPERTIES INTERPROCEDURAL_OPTIMIZATION TRUE)
else()
    message(STATUS "LTO not supported: ${error}")
endif()

target_link_libraries(appAnima_Pro PRIVATE
    Qt6::Quick
    Qt6::QuickControls2
    Qt6::Svg
    Qt6::Core
    Qt6::QuickEffects
)

if(WIN32)
    find_program(WINDEPLOYQT_EXECUTABLE windeployqt HINTS "${_qt6_install_prefix}/bin")

    add_custom_command(TARGET appAnima_Pro POST_BUILD
        COMMAND ${CMAKE_COMMAND} -E make_directory "${PORTABLE_DIR}"
        COMMAND ${CMAKE_COMMAND} -E copy "$<TARGET_FILE:appAnima_Pro>" "${PORTABLE_DIR}/Anima.exe"
        COMMAND "${WINDEPLOYQT_EXECUTABLE}"
                --qmldir "${CMAKE_CURRENT_SOURCE_DIR}"
                --no-translations
                --compiler-runtime
                "${PORTABLE_DIR}/Anima.exe"
        COMMAND ${CMAKE_COMMAND} -E tar "cfv" "${CMAKE_BINARY_DIR}/Anima_v2_Portable.zip"
                --format=zip "${PORTABLE_DIR}"
        COMMENT "Building portable release..."
    )
endif()
