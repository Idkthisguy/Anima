import QtQuick
import QtQuick.Controls
import QtQuick.Layouts
import QtQuick.Dialogs
import Anima.Backend

Item {
    id: root

    required property var mainWindow

    function doSave() {
        if (IO.currentPath === "")
            saveFileDlg.open();
        else
            MainEngine.saveProject(IO.currentPath);
    }

    function doMP4Export() {
        exportMP4Dlg.open();
    }

    function urlToPath(url) {
        var s = url.toString();
        if (s.startsWith("file:///") && Qt.platform.os === "windows")
            return s.slice(8).replace(/\//g, "\\");
        if (s.startsWith("file://"))
            return s.slice(7);
        return s;
    }

    property alias openFileDlg: openFileDlg
    property alias saveFileDlg: saveFileDlg
    property alias confirmNewDlg: confirmNewDlg
    property alias errToast: errToast
    property alias saveToast: saveToast
    property alias exportMP4Dlg: exportMP4Dlg

    FileDialog {
        id: openFileDlg
        title: "Open Project"
        fileMode: FileDialog.OpenFile
        nameFilters: ["All Anima files (*.anx *.anima)", "Anima v2 (*.anx)", "Anima v1 (*.anima)"]
        onAccepted: {
            var path = urlToPath(selectedFile);
            if (!MainEngine.openProject(path))
                errToast.show("Failed to open: " + path);
        }
    }

    FileDialog {
        id: saveFileDlg
        title: "Save Project"
        fileMode: FileDialog.SaveFile
        nameFilters: ["Anima v2 (*.anx)", "Anima v1 legacy (*.anima)", "All Files (*)"]
        onAccepted: {
            var path = urlToPath(selectedFile);
            if (!path.endsWith(".anx") && !path.endsWith(".anima"))
                path += ".anx";
            if (!MainEngine.saveProject(path))
                errToast.show("Failed to save: " + path);
        }
    }

    FileDialog {
        id: exportMP4Dlg
        title: "Export Animation as MP4"
        fileMode: FileDialog.SaveFile
        nameFilters: ["MP4 Video (*.mp4)"]

        onAccepted: {
            var path = urlToPath(selectedFile);

            if (MainEngine.exportMP4(path)) {
                saveToast.show("Exporting started...");
            } else {
                errToast.show("Export failed to start.");
            }
        }
    }

    Dialog {
        id: confirmNewDlg
        anchors.centerIn: root.mainWindow.contentItem
        modal: true
        width: 320

        background: Rectangle {
            color: pal.bg2
            border.color: pal.border
            radius: 8
        }
        header: null

        ColumnLayout {
            anchors {
                fill: parent
                margins: 20
            }
            spacing: 16

            Text {
                text: "New Project"
                color: pal.text
                font.pixelSize: 14
                font.weight: Font.SemiBold
            }

            Text {
                text: IO.isDirty ? "You have unsaved changes.\nCreate a new project anyway?" : "Create a new project?"
                color: pal.dim
                font.pixelSize: 12
                wrapMode: Text.Wrap
                Layout.fillWidth: true
            }

            RowLayout {
                Layout.fillWidth: true
                Item {
                    Layout.fillWidth: true
                }

                Rectangle {
                    width: 72
                    height: 28
                    radius: 5
                    color: pal.bg4
                    Text {
                        anchors.centerIn: parent
                        text: "Cancel"
                        color: pal.text
                        font.pixelSize: 12
                    }
                    TapHandler {
                        onTapped: confirmNewDlg.close()
                    }
                }

                Item {
                    width: 8
                }

                Rectangle {
                    width: 72
                    height: 28
                    radius: 5
                    color: pal.acc
                    Text {
                        anchors.centerIn: parent
                        text: "New"
                        color: "white"
                        font.pixelSize: 12
                    }
                    TapHandler {
                        onTapped: {
                            MainEngine.newProject();
                            confirmNewDlg.close();
                        }
                    }
                }
            }
        }
    }

    Rectangle {
        id: errToast
        parent: root.mainWindow.contentItem
        anchors {
            bottom: parent.bottom
            horizontalCenter: parent.horizontalCenter
            bottomMargin: 24
        }
        width: errMsg.implicitWidth + 32
        height: 36
        radius: 8
        color: "#c0392b"
        opacity: 0
        z: 999

        function show(msg) {
            errMsg.text = msg;
            errShowAnim.restart();
        }

        Text {
            id: errMsg
            anchors.centerIn: parent
            color: "white"
            font.pixelSize: 12
        }

        SequentialAnimation {
            id: errShowAnim
            NumberAnimation {
                target: errToast
                property: "opacity"
                to: 1
                duration: 150
            }
            PauseAnimation {
                duration: 3000
            }
            NumberAnimation {
                target: errToast
                property: "opacity"
                to: 0
                duration: 300
            }
        }
    }

    Rectangle {
        id: saveToast
        anchors {
            bottom: parent.bottom
            horizontalCenter: root.mainWindow.contentItem.horizontalCenter
            bottomMargin: 24
        }
        width: saveMsg.implicitWidth + 32
        height: 36
        radius: 8
        color: pal.green
        opacity: 0
        z: 998

        function show(msg) {
            saveMsg.text = msg;
            saveShowAnim.restart();
        }

        Text {
            id: saveMsg
            anchors.centerIn: parent
            color: "white"
            font.pixelSize: 12
        }

        SequentialAnimation {
            id: saveShowAnim
            NumberAnimation {
                target: saveToast
                property: "opacity"
                to: 1
                duration: 150
            }
            PauseAnimation {
                duration: 2000
            }
            NumberAnimation {
                target: saveToast
                property: "opacity"
                to: 0
                duration: 300
            }
        }
    }

    Connections {
        target: IO
        function onErrorOccurred(msg) {
            errToast.show(msg);
        }
        function onCurrentPathChanged() {
            if (IO.currentPath !== "") {
                var parts = IO.currentPath.replace(/\\/g, "/").split("/");
                saveToast.show("Saved: " + parts[parts.length - 1]);
            }
        }
    }

    Connections {
        target: MainEngine
        function onProjectLoaded() {
            if (IO.currentPath !== "") {
                var parts = IO.currentPath.replace(/\\/g, "/").split("/");
                saveToast.show("Opened: " + parts[parts.length - 1]);
            }
        }
    }
}
