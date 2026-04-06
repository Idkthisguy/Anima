import QtQuick
import QtQuick.Controls
import QtQuick.Layouts
import Anima.Backend

Rectangle {
    id: root
    color: pal.bg1

    required property var colorDialog

    Rectangle {
        anchors.left: parent.left
        width: 1
        height: parent.height
        color: pal.border
    }

    ScrollView {
        anchors {
            fill: parent
            leftMargin: 1
        }
        clip: true
        ScrollBar.horizontal.policy: ScrollBar.AlwaysOff

        ColumnLayout {
            width: root.width - 1
            spacing: 0

            PropSection {
                title: "BRUSH"

                ColumnLayout {
                    Layout.fillWidth: true
                    spacing: 6

                    RowLayout {
                        Layout.fillWidth: true
                        spacing: 10

                        PropSlider {
                            Layout.fillWidth: true
                            label: "Size"
                            value: MainEngine.brushSize
                            from: 1
                            to: 100
                            display: ""
                            onMoved: v => MainEngine.brushSize = Math.round(v)
                        }

                        NumInput {
                            value: MainEngine.brushSize
                            min: 1
                            max: 100
                            isFloat: false
                            onValueSet: v => MainEngine.brushSize = v
                        }

                        Text {
                            text: "px"
                            color: pal.dim
                            font.pixelSize: 10
                        }
                    }

                    Rectangle {
                        Layout.fillWidth: true
                        height: 28
                        radius: 5
                        color: MainEngine.color
                        border.color: pal.border
                        border.width: 1

                        Text {
                            anchors.centerIn: parent
                            text: MainEngine.color
                            color: parent.color.hsvLightness > 0.5 ? "#111" : "#eee"
                            font.pixelSize: 9
                            font.family: "Courier New"
                        }

                        TapHandler {
                            onTapped: root.colorDialog.open()
                        }
                    }
                }
            }

            PropSection {
                title: "ONION SKIN"

                ColumnLayout {
                    Layout.fillWidth: true
                    spacing: 10

                    CheckLabel {
                        label: "Toggle direction (O)"
                        checked: TL.onionBack
                        onToggled: TL.toggleOnionSkin()
                    }

                    RowLayout {
                        Layout.fillWidth: true
                        spacing: 10

                        PropSlider {
                            Layout.fillWidth: true
                            label: "Intensity"
                            value: TL.onionAlpha * 100
                            from: 2
                            to: 80
                            display: ""
                            onMoved: v => TL.onionAlpha = v / 100
                        }

                        NumInput {
                            value: Math.round(TL.onionAlpha * 100)
                            min: 2
                            max: 80
                            isFloat: false
                            onValueSet: v => TL.onionAlpha = v / 100
                        }

                        Text {
                            text: "%"
                            color: pal.dim
                            font.pixelSize: 10
                        }
                    }
                }
            }

            PropSection {
                title: "BRUSH OPTIONS"

                ColumnLayout {
                    Layout.fillWidth: true
                    spacing: 4

                    RowLayout {
                        Layout.fillWidth: true
                        spacing: 10

                        PropSlider {
                            Layout.fillWidth: true
                            label: "Smoothing"
                            value: MainEngine.smoothing
                            from: 0.0
                            to: 0.95
                            display: ""
                            onMoved: v => MainEngine.smoothing = v
                        }

                        NumInput {
                            value: Math.round(MainEngine.smoothing * 100)
                            min: 0
                            max: 95
                            isFloat: false
                            onValueSet: v => MainEngine.smoothing = v / 100
                        }

                        Text {
                            text: "%"
                            color: pal.dim
                            font.pixelSize: 10
                        }
                    }
                }
            }

            PropSection {
                title: "FRAME"

                ColumnLayout {
                    Layout.fillWidth: true
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

            PropSection {
                title: "FILE"

                ColumnLayout {
                    Layout.fillWidth: true
                    spacing: 4

                    Text {
                        text: IO.isDirty ? "unsaved changes" : "saved"
                        color: IO.isDirty ? pal.red : pal.dim
                        font.pixelSize: 10
                        Layout.alignment: Qt.AlignHCenter
                    }

                    Rectangle {
                        Layout.fillWidth: true
                        height: 28
                        radius: 4
                        color: pal.bg3
                        clip: true

                        Text {
                            anchors {
                                left: parent.left
                                right: parent.right
                                verticalCenter: parent.verticalCenter
                                leftMargin: 6
                                rightMargin: 6
                            }
                            text: IO.currentPath !== "" ? IO.currentPath : "no file"
                            color: pal.dim
                            font.pixelSize: 9
                            font.family: "Courier New"
                            elide: Text.ElideLeft
                        }
                    }
                }
            }

            Item {
                Layout.fillHeight: true
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

    component NumInput: Rectangle {
        id: numInputRoot
        required property real value
        required property real min
        required property real max
        property bool isFloat: false
        signal valueSet(real v)

        width: 45
        height: 24
        color: pal.bg3
        border.color: pal.border
        radius: 4

        DoubleValidator {
            id: dVal
            bottom: numInputRoot.min
            top: numInputRoot.max
            decimals: 2
        }

        IntValidator {
            id: iVal
            bottom: numInputRoot.min
            top: numInputRoot.max
        }

        TextField {
            anchors.fill: parent
            text: isFloat ? value.toFixed(2) : Math.round(value).toString()
            color: pal.text
            font.pixelSize: 11
            horizontalAlignment: Text.AlignHCenter
            verticalAlignment: Text.AlignVCenter
            background: null

            validator: isFloat ? dVal : iVal

            onEditingFinished: {
                var v = isFloat ? parseFloat(text) : parseInt(text);
                if (!isNaN(v))
                    valueSet(v);
                focus = false;
            }
        }
    }
}
