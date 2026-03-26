import QtQuick
import QtQuick.Controls

ApplicationWindow {
    id: window
    width: 1280
    height: 720
    visible: true
    title: "Anima v2.0"
    color: "#121212"

    menuBar: MenuBar {
        Menu {
            title: "File"
            Action { text: "New Project" }
            Action { text: "Save" }
            MenuSeparator { }
            Action { text: "Exit"; onTriggered: Qt.quit() }
        }
        Menu {
            title: "Edit"
            Action { text: "Undo" }
            Action { text: "Redo" }
        }
    }

    SplitView {
        anchors.fill: parent
        orientation: Qt.Vertical

        SplitView {
            SplitView.fillHeight: true
            orientation: Qt.Horizontal

            Rectangle {
                id: sidebar
                width: 250
                SplitView.minimumWidth: 150
                color: "#1e1e1e"
                border.color: "#333333"

                Label {
                    text: "ASSETS"
                    color: "gray"
                    anchors { top: parent.top; left: parent.left; margins: 10 }
                    font.pixelSize: 12
                }
            }

            Rectangle {
                id: viewport
                SplitView.fillWidth: true
                color: "#000000"

                Text {
                    anchors.centerIn: parent
                    text: "VIEWPORT"
                    color: "#333333"
                    font.pixelSize: 24
                }
            }

            Rectangle {
                id: properties
                width: 250
                color: "#1e1e1e"
                border.color: "#333333"

                Label {
                    text: "PROPERTIES"
                    color: "gray"
                    anchors { top: parent.top; left: parent.left; margins: 10 }
                    font.pixelSize: 12
                }
            }
        }

        Rectangle {
            id: timeline
            height: 200
            SplitView.minimumHeight: 100
            color: "#181818"
            border.color: "#333333"

            Row {
                anchors { top: parent.top; left: parent.left; margins: 10 }
                spacing: 10
                Button {
                    id: playBtn;
                    icon.source: "assets/icons/play.svg";
                    width: 40
                }
                Button {
                    id: stopBtn;
                    icon.source: "assets/icons/stop.svg";
                    width: 40
                }
            }
        }
    }
}