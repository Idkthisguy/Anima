cmake_minimum_required(VERSION 3.16)
project(Anima_Pro VERSION 2.0 LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 23)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

find_package(Qt6 REQUIRED COMPONENTS Quick QuickControls2 Svg Core)
qt_standard_project_setup(REQUIRES 6.5)

if(WIN32)
    set(EXE_ICON "resources.rc")
endif()

qt_add_executable(appAnima_Pro
    main.cpp
    engine.cpp
    canvasprovider.cpp
    fileio.cpp
    ${EXE_ICON}
)

qt_add_qml_module(appAnima_Pro
    URI Anima_Pro
    QML_FILES
    Main.qml

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
        RESOURCES README.md
        RESOURCES .gitignore
        RESOURCES
        SOURCES engine.h engine.cpp
        SOURCES Frames.h
        SOURCES canvasprovider.h canvasprovider.cpp
        LICENSE.txt
        SOURCES timeline.h timeline.cpp
        SOURCES fileio.h fileio.cpp
        RESOURCES CHANGELOG.md
        RESOURCES
)

set_target_properties(appAnima_Pro PROPERTIES
    OUTPUT_NAME "Anima"
    MACOSX_BUNDLE_BUNDLE_VERSION    ${PROJECT_VERSION}
    MACOSX_BUNDLE_SHORT_VERSION_STRING ${PROJECT_VERSION_MAJOR}.${PROJECT_VERSION_MINOR}
    MACOSX_BUNDLE TRUE
    WIN32_EXECUTABLE TRUE
)

target_link_libraries(appAnima_Pro PRIVATE
    Qt6::Quick
    Qt6::QuickControls2
    Qt6::Svg
    Qt6::Core
)

if(WIN32)
    find_program(WINDEPLOYQT_EXECUTABLE windeployqt HINTS "${_qt6_install_prefix}/bin")
    add_custom_command(TARGET appAnima_Pro POST_BUILD
        COMMAND "${CMAKE_COMMAND}" -E env PATH="${_qt6_install_prefix}/bin"
                "${WINDEPLOYQT_EXECUTABLE}" --qmldir "${CMAKE_CURRENT_SOURCE_DIR}"
                "$<TARGET_FILE:appAnima_Pro>"
        COMMENT "Deploying Qt dependencies...")

    set(PORTABLE_DIR "${CMAKE_BINARY_DIR}/Anima_Portable_v${PROJECT_VERSION}")
    add_custom_target(MakePortable
        COMMAND ${CMAKE_COMMAND} -E remove_directory "${PORTABLE_DIR}"
        COMMAND ${CMAKE_COMMAND} -E make_directory   "${PORTABLE_DIR}"
        COMMAND ${CMAKE_COMMAND} -E copy "$<TARGET_FILE:appAnima_Pro>" "${PORTABLE_DIR}/"
        COMMAND "${CMAKE_COMMAND}" -E env PATH="${_qt6_install_prefix}/bin"
                "${WINDEPLOYQT_EXECUTABLE}" --qmldir "${CMAKE_CURRENT_SOURCE_DIR}" "${PORTABLE_DIR}/Anima.exe"
        COMMAND ${CMAKE_COMMAND} -E copy "${CMAKE_CURRENT_SOURCE_DIR}/LICENSE.txt" "${PORTABLE_DIR}/"
        DEPENDS appAnima_Pro)
endif()

install(TARGETS appAnima_Pro
    BUNDLE  DESTINATION .
    LIBRARY DESTINATION ${CMAKE_INSTALL_LIBDIR}
    RUNTIME DESTINATION ${CMAKE_INSTALL_BINDIR})