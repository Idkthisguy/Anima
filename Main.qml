import QtQuick
import QtQuick.Controls
import QtQuick.Layouts
import QtQuick.Effects
import Anima.Backend
import Anima.Components 1.0

ApplicationWindow {
    id: root
    width: 1400
    height: 820
    minimumWidth: 900
    minimumHeight: 600
    visible: true
    title: "Anima  v2.0"
    color: "#0d0d0f"

    Shortcut {
        sequence: "B"
        onActivated: MainEngine.tool = 0
    }
    Shortcut {
        sequence: "E"
        onActivated: MainEngine.tool = 1
    }
    Shortcut {
        sequence: "G"
        onActivated: MainEngine.tool = 2
    }
    Shortcut {
        sequence: "I"
        onActivated: MainEngine.tool = 3
    }
    Shortcut {
        sequence: "Ctrl+Z"
        onActivated: TL.undo()
    }
    Shortcut {
        sequence: "Ctrl+Y"
        onActivated: TL.redo()
    }
    Shortcut {
        sequence: "Ctrl+Shift+Z"
        onActivated: TL.redo()
    }
    Shortcut {
        sequence: "Delete"
        onActivated: TL.clearFrame()
    }
    Shortcut {
        sequence: "Space"
        onActivated: TL.togglePlay()
    }
    Shortcut {
        sequence: "Right"
        onActivated: TL.next()
    }
    Shortcut {
        sequence: "Left"
        onActivated: TL.prev()
    }
    Shortcut {
        sequence: "O"
        onActivated: TL.toggleOnionSkin()
    }

    QtObject {
        id: pal
        readonly property color bg0: "#080809"
        readonly property color bg1: "#111113"
        readonly property color bg2: "#191b1e"
        readonly property color bg3: "#222428"
        readonly property color bg4: "#2c2f35"
        readonly property color acc: "#3d7dff"
        readonly property color accDim: "#1f3e80"
        readonly property color border: "#1e2025"
        readonly property color text: "#d4d4d8"
        readonly property color dim: "#606068"
        readonly property color red: "#e05252"
        readonly property color blue: "#5280e0"
    }

    menuBar: MenuBar {
        background: Rectangle {
            color: pal.bg1
            border.color: pal.border
            border.width: 0
        }

        delegate: MenuBarItem {
            contentItem: Text {
                text: parent.text
                color: parent.highlighted ? pal.acc : pal.text
                font.pixelSize: 12
                horizontalAlignment: Text.AlignHCenter
                verticalAlignment: Text.AlignVCenter
            }
            background: Rectangle {
                color: parent.highlighted ? pal.bg3 : "transparent"
                radius: 3
            }
        }
        Menu {
            title: "File"
            Action {
                text: "New Project"
                shortcut: "Ctrl+N"
                onTriggered: MainEngine.newProject()
            }
            Action {
                text: "Open…"
                shortcut: "Ctrl+O"
            }
            MenuSeparator {}
            Action {
                text: "Save"
                shortcut: "Ctrl+S"
            }
            Action {
                text: "Save As…"
                shortcut: "Ctrl+Shift+S"
            }
            MenuSeparator {}
            Action {
                text: "Export GIF"
            }
            Action {
                text: "Export MP4"
            }
            MenuSeparator {}
            Action {
                text: "Exit"
                onTriggered: Qt.quit()
            }
        }
        Menu {
            title: "Edit"
            Action {
                text: "Undo"
                shortcut: "Ctrl+Z"
                onTriggered: TL.undo()
            }
            Action {
                text: "Redo"
                shortcut: "Ctrl+Y"
                onTriggered: TL.redo()
            }
            MenuSeparator {}
            Action {
                text: "Clear Frame"
                shortcut: "Delete"
                onTriggered: TL.clearFrame()
            }
        }
        Menu {
            title: "Animation"
            Action {
                text: "Play / Pause"
                shortcut: "Space"
                onTriggered: TL.togglePlay()
            }
            Action {
                text: "Next Frame"
                shortcut: "Right"
                onTriggered: TL.next()
            }
            Action {
                text: "Prev Frame"
                shortcut: "Left"
                onTriggered: TL.prev()
            }
            Action {
                text: "Add Frame"
                shortcut: "Ctrl+J"
                onTriggered: TL.addFrame()
            }
        }
    }

    RowLayout {
        anchors.fill: parent
        spacing: 0

        Rectangle {
            id: toolbar
            width: 48
            Layout.fillHeight: true
            color: pal.bg1

            Rectangle {
                anchors.right: parent.right
                width: 1
                height: parent.height
                color: pal.border
            }

            Column {
                anchors {
                    top: parent.top
                    horizontalCenter: parent.horizontalCenter
                }
                anchors.topMargin: 12
                spacing: 4

                Repeater {
                    model: [
                        {
                            lbl: "Br",
                            tip: "Brush (B)",
                            id: 0
                        },
                        {
                            lbl: "Er",
                            tip: "Eraser (E)",
                            id: 1
                        },
                        {
                            lbl: "Bk",
                            tip: "Bucket (G)",
                            id: 2
                        },
                        {
                            lbl: "Ey",
                            tip: "Eyedrop (I)",
                            id: 3
                        },
                    ]
                    delegate: Item {
                        width: 40
                        height: 36
                        required property var modelData

                        Rectangle {
                            anchors {
                                left: parent.left
                                verticalCenter: parent.verticalCenter
                            }
                            width: 3
                            height: 28
                            radius: 2
                            color: pal.acc
                            visible: MainEngine.tool === modelData.id
                        }

                        Rectangle {
                            anchors.centerIn: parent
                            width: 34
                            height: 32
                            radius: 5
                            color: MainEngine.tool === modelData.id ? pal.accDim : toolHover.containsMouse ? pal.bg4 : "transparent"

                            Text {
                                anchors.centerIn: parent
                                text: modelData.lbl
                                color: MainEngine.tool === modelData.id ? pal.acc : pal.dim
                                font.pixelSize: 11
                                font.weight: Font.Medium
                            }

                            HoverHandler {
                                id: toolHover
                            }
                            TapHandler {
                                onTapped: MainEngine.tool = modelData.id
                            }

                            ToolTip.visible: toolHover.hovered
                            ToolTip.text: modelData.tip
                            ToolTip.delay: 600
                        }
                    }
                }

                Rectangle {
                    width: 32
                    height: 1
                    color: pal.border
                    anchors.horizontalCenter: parent.horizontalCenter
                    anchors.topMargin: 4
                    anchors.bottomMargin: 4
                }

                Repeater {
                    model: [
                        {
                            lbl: "Un",
                            tip: "Undo  Ctrl+Z"
                        },
                        {
                            lbl: "Re",
                            tip: "Redo  Ctrl+Y"
                        }
                    ]
                    delegate: Rectangle {
                        width: 34
                        height: 28
                        radius: 4
                        anchors.horizontalCenter: parent.horizontalCenter
                        color: urHover.containsMouse ? pal.bg4 : "transparent"
                        required property var modelData

                        Text {
                            anchors.centerIn: parent
                            text: modelData.lbl
                            color: pal.dim
                            font.pixelSize: 11
                        }
                        HoverHandler {
                            id: urHover
                        }
                        TapHandler {
                            onTapped: modelData.lbl === "Un" ? TL.undo() : TL.redo()
                        }
                        ToolTip.visible: urHover.hovered
                        ToolTip.text: modelData.tip
                        ToolTip.delay: 600
                    }
                }

                Rectangle {
                    width: 32
                    height: 1
                    color: pal.border
                    anchors.horizontalCenter: parent.horizontalCenter
                }

                Rectangle {
                    width: 34
                    height: 34
                    radius: 6
                    anchors.horizontalCenter: parent.horizontalCenter
                    color: MainEngine.color
                    border.color: Qt.lighter(pal.border, 1.4)
                    border.width: 1.5

                    HoverHandler {
                        id: swatchHover
                    }
                    TapHandler {
                        onTapped: colorDialog.open()
                    }
                    ToolTip.visible: swatchHover.hovered
                    ToolTip.text: "Color"
                    ToolTip.delay: 600
                }
            }
        }

        ColumnLayout {
            Layout.fillWidth: true
            Layout.fillHeight: true
            spacing: 0

            Rectangle {
                id: viewportArea
                Layout.fillWidth: true
                Layout.fillHeight: true
                color: "#0a0a0c"

                Canvas {
                    anchors.fill: parent
                    onPaint: {
                        var ctx = getContext("2d");
                        var s = 14;
                        for (var r = 0; r * s < height; r++) {
                            for (var c = 0; c * s < width; c++) {
                                ctx.fillStyle = (r + c) % 2 === 0 ? "#141416" : "#101012";
                                ctx.fillRect(c * s, r * s, s, s);
                            }
                        }
                    }
                }

                Item {
                    id: canvasFrame
                    anchors.centerIn: parent
                    width: Math.min(parent.width - 40, (parent.height - 40) * (1280 / 720))
                    height: width * (720 / 1280)

                    Rectangle {
                        anchors {
                            fill: parent
                            topMargin: -0
                            leftMargin: -0
                        }
                        x: 6
                        y: 6
                        color: "transparent"
                        layer.enabled: true
                        layer.effect: null
                        Rectangle {
                            anchors.fill: parent
                            color: "#000000"
                            opacity: .35
                            radius: 3
                        }
                    }

                    DrawingCanvas {
                        id: mainCanvas
                        anchors.fill: parent

                        Connections {
                            target: MainEngine
                            function onFrameUpdated(img) {
                                mainCanvas.updateImage(img);
                            }
                            function onColorPicked(hex) {
                                MainEngine.color = hex;
                            }
                        }

                        MouseArea {
                            id: drawArea
                            anchors.fill: parent
                            hoverEnabled: true
                            cursorShape: Qt.BlankCursor

                            function toCanvas(mx, my) {
                                return Qt.point(mx / width * 1280, my / height * 720);
                            }

                            onPressed: m => {
                                var p = toCanvas(m.x, m.y);
                                MainEngine.beginStroke(p.x, p.y);
                            }
                            onPositionChanged: m => {
                                if (pressed) {
                                    var p = toCanvas(m.x, m.y);
                                    MainEngine.paintAt(p.x, p.y);
                                }
                            }
                            onReleased: MainEngine.endStroke()
                            onExited: MainEngine.endStroke()
                        }

                        Rectangle {
                            id: cursorCircle
                            width: Math.max(4, MainEngine.brushSize * canvasFrame.width / 1280 * 2)
                            height: width
                            radius: width / 2
                            color: "transparent"
                            border.color: "white"
                            border.width: 1
                            opacity: drawArea.containsMouse ? 0.8 : 0
                            visible: MainEngine.tool !== 3

                            Rectangle {
                                anchors.centerIn: parent
                                width: 3
                                height: 3
                                radius: 2
                                color: "white"
                                opacity: .9
                            }
                        }
                    }
                }

                Rectangle {
                    anchors {
                        right: parent.right
                        bottom: parent.bottom
                        margins: 12
                    }
                    width: zoomLabel.implicitWidth + 16
                    height: 22
                    radius: 4
                    color: "#000000"
                    opacity: .55

                    Text {
                        id: zoomLabel
                        anchors.centerIn: parent
                        text: Math.round(canvasFrame.width / 1280 * 100) + "%"
                        color: "#a0a0b0"
                        font.pixelSize: 11
                    }
                }

                Rectangle {
                    anchors {
                        left: parent.left
                        top: parent.top
                        margins: 12
                    }
                    width: infoTxt.implicitWidth + 18
                    height: 22
                    radius: 4
                    color: "#000000"
                    opacity: .55

                    Text {
                        id: infoTxt
                        anchors.centerIn: parent
                        text: {
                            var t = ["Brush", "Eraser", "Bucket", "Eyedrop"][MainEngine.tool];
                            return "Fr " + (TL.currentFrame + 1) + "/" + TL.frameCount + "  " + t + "  " + MainEngine.brushSize + "px";
                        }
                        color: "#a8a8c0"
                        font.pixelSize: 11
                    }
                }
            }

            Rectangle {
                width: parent.width
                height: 1
                color: pal.acc
                opacity: .35
            }

            Rectangle {
                id: timelinePanel
                Layout.fillWidth: true
                height: 180
                color: pal.bg1

                ColumnLayout {
                    anchors {
                        fill: parent
                        margins: 8
                    }
                    spacing: 6

                    RowLayout {
                        spacing: 6

                        Rectangle {
                            width: 52
                            height: 26
                            radius: 4
                            color: TL.playing ? pal.acc : pal.bg3

                            Text {
                                anchors.centerIn: parent
                                text: TL.playing ? "  ‖  " : "  ▶  "
                                color: TL.playing ? "white" : pal.text
                                font.pixelSize: 13
                            }
                            TapHandler {
                                onTapped: TL.togglePlay()
                            }
                        }

                        Rectangle {
                            width: 30
                            height: 26
                            radius: 4
                            color: pal.bg3
                            Text {
                                anchors.centerIn: parent
                                text: "■"
                                color: pal.dim
                                font.pixelSize: 11
                            }
                            TapHandler {
                                onTapped: TL.stop()
                            }
                        }

                        Rectangle {
                            width: 26
                            height: 26
                            radius: 4
                            color: pal.bg3
                            Text {
                                anchors.centerIn: parent
                                text: "◀"
                                color: pal.dim
                                font.pixelSize: 10
                            }
                            TapHandler {
                                onTapped: TL.prev()
                            }
                        }
                        Rectangle {
                            width: 26
                            height: 26
                            radius: 4
                            color: pal.bg3
                            Text {
                                anchors.centerIn: parent
                                text: "▶"
                                color: pal.dim
                                font.pixelSize: 10
                            }
                            TapHandler {
                                onTapped: TL.next()
                            }
                        }

                        Text {
                            text: String(TL.currentFrame + 1).padStart(3, "0") + " / " + String(TL.frameCount).padStart(3, "0")
                            color: pal.dim
                            font.pixelSize: 12
                            font.family: "Courier New"
                        }

                        Slider {
                            Layout.fillWidth: true
                            from: 0
                            to: Math.max(0, TL.frameCount - 1)
                            value: TL.currentFrame
                            stepSize: 1
                            onMoved: {
                                TL.stop();
                                TL.goTo(value);
                            }

                            background: Rectangle {
                                x: parent.leftPadding
                                y: parent.topPadding + parent.availableHeight / 2 - height / 2
                                width: parent.availableWidth
                                height: 4
                                radius: 2
                                color: pal.bg4

                                Rectangle {
                                    width: parent.parent.visualPosition * parent.width
                                    height: parent.height
                                    radius: 2
                                    color: pal.acc
                                }
                            }
                            handle: Rectangle {
                                x: parent.leftPadding + parent.visualPosition * parent.availableWidth - width / 2
                                y: parent.topPadding + parent.availableHeight / 2 - height / 2
                                width: 12
                                height: 12
                                radius: 6
                                color: pal.acc
                            }
                        }

                        Text {
                            text: "FPS"
                            color: pal.dim
                            font.pixelSize: 11
                        }
                        Rectangle {
                            width: 40
                            height: 24
                            radius: 3
                            color: pal.bg3
                            TextInput {
                                anchors {
                                    fill: parent
                                    margins: 4
                                }
                                text: TL.fps
                                color: pal.acc
                                font.pixelSize: 12
                                font.family: "Courier New"
                                validator: IntValidator {
                                    bottom: 1
                                    top: 120
                                }
                                onEditingFinished: TL.fps = parseInt(text)
                            }
                        }

                        Row {
                            spacing: 4
                            Rectangle {
                                width: 16
                                height: 16
                                radius: 3
                                color: TL.looping ? pal.acc : pal.bg4
                                border.color: pal.border
                                border.width: 1
                                Text {
                                    anchors.centerIn: parent
                                    text: "✓"
                                    color: "white"
                                    font.pixelSize: 10
                                    visible: TL.looping
                                }
                                TapHandler {
                                    onTapped: TL.looping = !TL.looping
                                }
                            }
                            Text {
                                text: "Loop"
                                color: pal.dim
                                font.pixelSize: 11
                                anchors.verticalCenter: parent.verticalCenter
                            }
                        }
                    }

                    Rectangle {
                        Layout.fillWidth: true
                        Layout.fillHeight: true
                        color: pal.bg0
                        radius: 4

                        ScrollView {
                            anchors.fill: parent
                            clip: true
                            ScrollBar.vertical.policy: ScrollBar.AlwaysOff

                            Row {
                                spacing: 3
                                padding: 6

                                Repeater {
                                    model: TL.frameCount
                                    delegate: Rectangle {
                                        required property int index
                                        width: 28
                                        height: timelinePanel.height - 60
                                        radius: 3

                                        color: {
                                            if (index === TL.currentFrame)
                                                return pal.acc;
                                            if (index === TL.currentFrame - 1 && TL.onionBack)
                                                return Qt.rgba(.86, .32, .32, .22);
                                            if (index === TL.currentFrame + 1 && TL.onionForward)
                                                return Qt.rgba(.32, .50, .86, .22);
                                            return pal.bg3;
                                        }

                                        Rectangle {
                                            anchors {
                                                horizontalCenter: parent.horizontalCenter
                                                top: parent.top
                                                topMargin: 6
                                            }
                                            width: 6
                                            height: 6
                                            radius: 3
                                            color: index === TL.currentFrame ? "white" : pal.acc
                                            opacity: .8
                                        }

                                        Text {
                                            visible: index % 5 === 0
                                            anchors {
                                                bottom: parent.bottom
                                                horizontalCenter: parent.horizontalCenter
                                                bottomMargin: 4
                                            }
                                            text: index
                                            color: index === TL.currentFrame ? "white" : pal.dim
                                            font.pixelSize: 9
                                        }

                                        Rectangle {
                                            visible: (index === TL.currentFrame - 1 || index === TL.currentFrame - 2) && TL.onionBack
                                            anchors.fill: parent
                                            radius: 3
                                            color: "transparent"
                                            border.color: pal.red
                                            border.width: 1.5
                                        }
                                        Rectangle {
                                            visible: (index === TL.currentFrame + 1) && TL.onionForward
                                            anchors.fill: parent
                                            radius: 3
                                            color: "transparent"
                                            border.color: pal.blue
                                            border.width: 1.5
                                        }

                                        TapHandler {
                                            onTapped: {
                                                TL.stop();
                                                TL.goTo(index);
                                            }
                                        }

                                        TapHandler {
                                            acceptedButtons: Qt.RightButton
                                            onTapped: {
                                                frameMenu.targetIndex = index;
                                                frameMenu.popup();
                                            }
                                        }
                                    }
                                }

                                Rectangle {
                                    width: 28
                                    height: timelinePanel.height - 60
                                    radius: 3
                                    color: addHover.containsMouse ? pal.bg4 : pal.bg2

                                    Text {
                                        anchors.centerIn: parent
                                        text: "+"
                                        color: pal.dim
                                        font.pixelSize: 18
                                    }
                                    HoverHandler {
                                        id: addHover
                                    }
                                    TapHandler {
                                        onTapped: TL.addFrame()
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }

        Rectangle {
            id: propsPanel
            width: 220
            Layout.fillHeight: true
            color: pal.bg1

            Rectangle {
                anchors.left: parent.left
                width: 1
                height: parent.height
                color: pal.border
            }

            ScrollView {
                anchors.fill: parent
                anchors.leftMargin: 1
                clip: true
                ScrollBar.horizontal.policy: ScrollBar.AlwaysOff

                ColumnLayout {
                    width: propsPanel.width - 1
                    spacing: 0

                    PropSection {
                        title: "BRUSH"
                        ColumnLayout {
                            width: parent.width
                            spacing: 8

                            PropSlider {
                                label: "Size"
                                value: MainEngine.brushSize
                                from: 1
                                to: 100
                                onMoved: v => MainEngine.brushSize = v
                                display: MainEngine.brushSize + "px"
                            }

                            PropSlider {
                                label: "Opacity"
                                value: MainEngine.opacity * 100
                                from: 0
                                to: 100
                                onMoved: v => MainEngine.opacity = v / 100
                                display: Math.round(MainEngine.opacity * 100) + "%"
                            }

                            Rectangle {
                                Layout.fillWidth: true
                                height: 24
                                radius: 4
                                color: MainEngine.color
                                border.color: pal.border
                                border.width: 1
                                Text {
                                    anchors.centerIn: parent
                                    text: MainEngine.color
                                    color: Qt.hsla(0, 0, Qt.colorEqual(MainEngine.color, "black") ? 1 : 0, 1)
                                    font.pixelSize: 10
                                }
                                TapHandler {
                                    onTapped: colorDialog.open()
                                }
                            }
                        }
                    }

                    PropSection {
                        title: "ONION SKIN"
                        ColumnLayout {
                            width: parent.width
                            spacing: 8

                            Row {
                                spacing: 8
                                CheckLabel {
                                    label: "Toggle onion skin direction (O)"
                                    checked: TL.onionBack
                                    onToggled: TL.toggleOnionSkin()
                                }
                            }

                            PropSlider {
                                label: "Intensity"
                                value: TL.onionAlpha * 100
                                from: 2
                                to: 80
                                onMoved: v => TL.onionAlpha = v / 100
                                display: Math.round(TL.onionAlpha * 100) + "%"
                            }
                        }
                    }

                    PropSection {
                        title: "BRUSH OPTIONS"
                        ColumnLayout {
                            width: parent.width
                            spacing: 8

                            PropSlider {
                                id: smoothSlider
                                label: "Brush Smoothing"
                                from: 0.0
                                to: 0.95
                                value: MainEngine.smoothing
                                display: Math.round(MainEngine.smoothing * 100) + "%"

                                onMoved: v => MainEngine.smoothing = v
                            }

                            Text {
                                text: Math.round(smoothSlider.value * 100) + "%"
                                color: "white"
                                font.pixelSize: 11
                                width: 30
                            }
                        }
                    }

                    PropSection {
                        title: "FRAME"
                        ColumnLayout {
                            width: parent.width
                            spacing: 6

                            PropButton {
                                label: "+ Add Frame"
                                onClicked: TL.addFrame()
                            }
                            PropButton {
                                label: "Duplicate"
                                onClicked: TL.duplicateFrame(TL.currentFrame)
                            }
                            PropButton {
                                label: "Delete"
                                danger: true
                                onClicked: TL.deleteFrame(TL.currentFrame)
                            }
                            PropButton {
                                label: "Clear"
                                danger: true
                                onClicked: TL.clearFrame()
                            }
                        }
                    }

                    Item {
                        Layout.fillHeight: true
                    }
                }
            }
        }
    }

    Menu {
        id: frameMenu
        property int targetIndex: 0

        background: Rectangle {
            color: pal.bg2
            border.color: pal.border
            border.width: 1
            radius: 4
        }

        MenuItem {
            text: "Duplicate"
            onTriggered: TL.duplicateFrame(frameMenu.targetIndex)
            contentItem: Text {
                text: parent.text
                color: pal.text
                font.pixelSize: 12
                leftPadding: 8
            }
            background: Rectangle {
                color: parent.highlighted ? pal.bg4 : "transparent"
            }
        }
        MenuItem {
            text: "Delete"
            onTriggered: TL.deleteFrame(frameMenu.targetIndex)
            contentItem: Text {
                text: parent.text
                color: pal.red
                font.pixelSize: 12
                leftPadding: 8
            }
            background: Rectangle {
                color: parent.highlighted ? pal.bg4 : "transparent"
            }
        }
        MenuItem {
            text: "Clear Content"
            onTriggered: {
                TL.goTo(frameMenu.targetIndex);
                TL.clearFrame();
            }
            contentItem: Text {
                text: parent.text
                color: pal.text
                font.pixelSize: 12
                leftPadding: 8
            }
            background: Rectangle {
                color: parent.highlighted ? pal.bg4 : "transparent"
            }
        }
    }

    Dialog {
        id: colorDialog
        title: "Pick Color"
        anchors.centerIn: parent
        width: 300
        height: 350
        modal: true

        background: Rectangle {
            color: pal.bg2
            border.color: pal.border
            border.width: 1
            radius: 6
        }
        header: null

        ColumnLayout {
            anchors.fill: parent
            anchors.margins: 16
            spacing: 12

            Text {
                text: "Color"
                color: pal.text
                font.pixelSize: 13
                font.weight: Font.Medium
            }

            Rectangle {
                Layout.fillWidth: true
                height: 200
                radius: 4
                color: pal.bg3
                Text {
                    anchors.centerIn: parent
                    text: "Hex input below\n(full picker coming)"
                    color: pal.dim
                    font.pixelSize: 11
                    horizontalAlignment: Text.AlignHCenter
                }
            }

            Row {
                spacing: 8
                Text {
                    text: "#"
                    color: pal.dim
                    font.pixelSize: 13
                    anchors.verticalCenter: parent.verticalCenter
                }
                Rectangle {
                    width: 100
                    height: 28
                    radius: 4
                    color: pal.bg4
                    border.color: pal.border
                    TextInput {
                        id: hexInput
                        anchors {
                            fill: parent
                            margins: 6
                        }
                        text: MainEngine.color.replace("#", "")
                        color: pal.text
                        font.pixelSize: 12
                        font.family: "Courier New"
                        maximumLength: 6
                        onEditingFinished: MainEngine.setColor("#" + text)
                    }
                }
                Rectangle {
                    width: 28
                    height: 28
                    radius: 4
                    color: "#" + hexInput.text
                }
            }

            RowLayout {
                Layout.fillWidth: true
                Item {
                    Layout.fillWidth: true
                }
                Button {
                    text: "OK"
                    onClicked: {
                        MainEngine.setColor("#" + hexInput.text);
                        colorDialog.close();
                    }
                    background: Rectangle {
                        color: pal.acc
                        radius: 4
                    }
                    contentItem: Text {
                        text: parent.text
                        color: "white"
                        font.pixelSize: 12
                        horizontalAlignment: Text.AlignHCenter
                    }
                }
            }
        }
    }

    component PropSection: ColumnLayout {
        required property string title
        default property alias content: inner.children
        Layout.fillWidth: true
        spacing: 0

        Rectangle {
            Layout.fillWidth: true
            height: 1
            color: pal.border
        }

        Rectangle {
            Layout.fillWidth: true
            height: 32
            color: pal.bg2
            Text {
                anchors {
                    left: parent.left
                    verticalCenter: parent.verticalCenter
                    leftMargin: 10
                }
                text: title
                color: pal.dim
                font.pixelSize: 10
                font.weight: Font.Medium
                font.letterSpacing: 1
            }
        }

        ColumnLayout {
            id: inner
            Layout.fillWidth: true
            Layout.leftMargin: 10
            Layout.rightMargin: 10
            Layout.topMargin: 8
            Layout.bottomMargin: 10
            spacing: 6
        }
    }

    component PropSlider: ColumnLayout {
        required property string label
        required property real value
        required property real from
        required property real to
        required property string display
        signal moved(real v)

        Layout.fillWidth: true
        spacing: 3

        RowLayout {
            Layout.fillWidth: true
            Text {
                text: label
                color: pal.dim
                font.pixelSize: 10
            }
            Item {
                Layout.fillWidth: true
            }
            Text {
                text: display
                color: pal.text
                font.pixelSize: 10
            }
        }

        Rectangle {
            Layout.fillWidth: true
            height: 18
            radius: 3
            color: pal.bg3
            clip: true

            Rectangle {
                width: parent.width * ((value - from) / (to - from))
                height: parent.height
                radius: 3
                color: Qt.rgba(pal.acc.r, pal.acc.g, pal.acc.b, .35)
            }

            MouseArea {
                anchors.fill: parent
                onPressed: m => moved(from + (m.x / width) * (to - from))
                onPositionChanged: m => {
                    if (pressed)
                        moved(from + Math.max(0, Math.min(1, m.x / width)) * (to - from));
                }
            }
        }
    }

    component PropButton: Rectangle {
        required property string label
        property bool danger: false
        signal clicked
        Layout.fillWidth: true
        height: 26
        radius: 4
        color: btnHov.containsMouse ? (danger ? Qt.rgba(.86, .3, .3, .25) : pal.bg4) : pal.bg3

        Text {
            anchors.centerIn: parent
            text: label
            color: danger ? pal.red : pal.text
            font.pixelSize: 11
        }
        HoverHandler {
            id: btnHov
        }
        TapHandler {
            onTapped: parent.clicked()
        }
    }

    component CheckLabel: Row {
        required property string label
        required property bool checked
        signal toggled
        spacing: 5

        Rectangle {
            width: 14
            height: 14
            radius: 3
            color: checked ? pal.acc : pal.bg4
            border.color: pal.border
            border.width: 1
            anchors.verticalCenter: parent.verticalCenter

            Text {
                anchors.centerIn: parent
                text: "✓"
                color: "white"
                font.pixelSize: 9
                visible: checked
            }
            TapHandler {
                onTapped: parent.parent.toggled()
            }
        }
        Text {
            text: label
            color: pal.dim
            font.pixelSize: 10
            anchors.verticalCenter: parent.verticalCenter
        }
    }

    Item {
        id: customCursor
        z: 1000
        width: MainEngine.brushSize
        height: MainEngine.brushSize
        property point globalPos: drawArea.mapToItem(root.contentItem, drawArea.mouseX, drawArea.mouseY)
        x: globalPos.x - (width / 2)
        y: globalPos.y - (height / 2)
        visible: drawArea.containsMouse

        Item {
            anchors.fill: parent
            visible: !drawArea.pressed
            Rectangle {
                anchors.centerIn: parent
                width: 4
                height: 16
                color: "black"
                Rectangle {
                    anchors.centerIn: parent
                    width: 2
                    height: 14
                    color: "white"
                }
            }
            Rectangle {
                anchors.centerIn: parent
                width: 16
                height: 4
                color: "black"
                Rectangle {
                    anchors.centerIn: parent
                    width: 14
                    height: 2
                    color: "white"
                }
            }
        }

        Rectangle {
            visible: drawArea.pressed
            anchors.fill: parent
            radius: width / 2
            color: "transparent"

            border.color: "black"
            border.width: 3

            Rectangle {
                anchors.fill: parent
                anchors.margins: 1
                radius: width / 2
                color: "transparent"
                border.color: "white"
                border.width: 1
            }
        }
    }
}
