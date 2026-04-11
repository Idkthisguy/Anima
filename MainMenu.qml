import QtQuick
import QtQuick.Controls
import QtQuick.Layouts
import QtQuick.Dialogs
import QtCore
import Anima.Backend

ApplicationWindow {
    id: menuWindow
    width: 760
    height: 480
    visible: true
    title: "Anima - Home"
    color: "#0a0a0c"

    minimumWidth: width
    maximumWidth: width
    minimumHeight: height
    maximumHeight: height

    Component.onCompleted: {
        x = Screen.width / 2 - width / 2;
        y = Screen.height / 2 - height / 2;
    }

    Settings {
        id: appSettings
        property string recentFilesCache: "[]"
    }

    property var activeRecentFiles: {
        try {
            return JSON.parse(appSettings.recentFilesCache);
        } catch (e) {
            return [];
        }
    }

    function addRecentFile(path) {
        var arr = activeRecentFiles;

        var idx = arr.indexOf(path);
        if (idx !== -1)
            arr.splice(idx, 1);
        arr.unshift(path);
        if (arr.length > 6)
            arr.pop();

        activeRecentFiles = arr;
        appSettings.recentFilesCache = JSON.stringify(arr);
    }

    function getFileName(path) {
        var parts = path.replace(/\\/g, "/").split("/");
        return parts[parts.length - 1];
    }

    function launchEditor() {
        var component = Qt.createComponent("Main.qml");
        if (component.status === Component.Ready) {
            var editorWindow = component.createObject(null);
            editorWindow.show();
            menuWindow.close();
        } else {
            console.error("Editor Error:", component.errorString());
        }
    }

    FileDialog {
        id: openFileDlg
        title: "Select an Anima Project"
        currentFolder: StandardPaths.writableLocation(StandardPaths.DocumentsLocation)
        nameFilters: ["Anima files (*.anx *.anima)"]
        onAccepted: {
            var path = selectedFile.toString().replace("file:///", "");
            if (MainEngine.openProject(path)) {
                addRecentFile(path);
                launchEditor();
            }
        }
    }

    RowLayout {
        anchors.fill: parent
        anchors.margins: 40
        spacing: 40

        ColumnLayout {
            Layout.fillWidth: true
            Layout.fillHeight: true
            spacing: 15

            Text {
                text: "Recent Projects"
                color: "#a0a0a5"
                font.pixelSize: 16
                font.weight: Font.DemiBold
            }

            ListView {
                id: recentList
                Layout.fillWidth: true
                Layout.fillHeight: true
                clip: true
                model: activeRecentFiles
                spacing: 4

                Text {
                    visible: recentList.count === 0
                    text: "No recent projects found."
                    color: "#404045"
                    font.pixelSize: 13
                    anchors.centerIn: parent
                }

                delegate: Rectangle {
                    width: ListView.view.width
                    height: 54
                    radius: 6
                    color: recHov.hovered ? "#16171a" : "transparent"
                    border.color: recHov.hovered ? "#2c2f35" : "transparent"

                    Column {
                        anchors.verticalCenter: parent.verticalCenter
                        anchors.left: parent.left
                        anchors.leftMargin: 12
                        spacing: 2

                        Text {
                            text: getFileName(modelData)
                            color: recHov.hovered ? "#3d7dff" : "#d4d4d8"
                            font.pixelSize: 14
                            font.weight: Font.Medium
                        }
                        Text {
                            text: modelData
                            color: "#505055"
                            font.pixelSize: 10
                            elide: Text.ElideMiddle
                            width: parent.parent.width - 24
                        }
                    }

                    HoverHandler {
                        id: recHov
                    }
                    TapHandler {
                        onTapped: {
                            if (MainEngine.openProject(modelData)) {
                                addRecentFile(modelData);
                                launchEditor();
                            } else {
                                console.log("Failed to open:", modelData);
                            }
                        }
                    }
                }
            }
        }

        Rectangle {
            Layout.fillHeight: true
            width: 1
            color: "#1e2025"
        }

        ColumnLayout {
            Layout.preferredWidth: 260
            spacing: 16

            Item {
                Layout.fillHeight: true
            }

            Text {
                text: "Idkthisguy's"
                color: "white"
                font.pixelSize: 18
                font.weight: Font.Bold
                Layout.alignment: Qt.AlignLeft
                Layout.bottomMargin: 5
            }

            Text {
                text: "Anima v2.0"
                color: "white"
                font.pixelSize: 36
                font.weight: Font.Bold
                Layout.alignment: Qt.AlignLeft
                Layout.bottomMargin: 10
            }

            Rectangle {
                Layout.fillWidth: true
                height: 48
                radius: 6
                color: newHov.hovered ? "#4a87ff" : "#3d7dff"

                Text {
                    anchors.centerIn: parent
                    text: "+  New Project"
                    color: "white"
                    font.pixelSize: 14
                    font.weight: Font.DemiBold
                }
                HoverHandler {
                    id: newHov
                }
                TapHandler {
                    onTapped: {
                        MainEngine.newProject();
                        launchEditor();
                    }
                }
            }

            Rectangle {
                Layout.fillWidth: true
                height: 48
                radius: 6
                color: openHov.hovered ? "#2c2f35" : "#1e2025"
                border.color: "#2c2f35"

                Text {
                    anchors.centerIn: parent
                    text: " Open Project"
                    color: "#d4d4d8"
                    font.pixelSize: 14
                    font.weight: Font.DemiBold
                }
                HoverHandler {
                    id: openHov
                }
                TapHandler {
                    onTapped: openFileDlg.open()
                }
            }

            Item {
                Layout.fillHeight: true
            }

            RowLayout {
                spacing: 10
                Text {
                    text: "Support & Docs"
                    color: linkHov.hovered ? "#3d7dff" : "#505055"
                    font.pixelSize: 12
                    Layout.alignment: Qt.AlignHCenter
                    font.underline: linkHov.hovered

                    HoverHandler {
                        id: linkHov
                    }
                    TapHandler {
                        onTapped: Qt.openUrlExternally("https://github.com/Idkthisguy/Anima/wiki")
                    }
                }

                Text {
                    text: "Source Code"
                    color: linkHovSourceCode.hovered ? "#3d7dff" : "#505055"
                    font.pixelSize: 12
                    Layout.alignment: Qt.AlignHCenter
                    font.underline: linkHovSourceCode.hovered

                    HoverHandler {
                        id: linkHovSourceCode
                    }
                    TapHandler {
                        onTapped: Qt.openUrlExternally("https://github.com/Idkthisguy/Anima")
                    }
                }
            }

            Text {
                text: "(c) 2026 Idkthisguy. Licensed under GNU GPL v3."
                color: "#333336"
                font.pixelSize: 10
                Layout.alignment: Qt.AlignHCenter
                opacity: 0.9
            }
        }
    }
}
