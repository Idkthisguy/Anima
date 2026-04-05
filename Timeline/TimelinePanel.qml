import QtQuick
import QtQuick.Controls
import QtQuick.Layouts
import QtQuick.Effects
import Anima.Backend

Rectangle {
    id: root
    color: pal.bg1

    required property var frameMenu

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

                Image {
                    id: playPauseIcon
                    anchors.centerIn: parent
                    source: TL.playing ? "../assets/icons/pause.svg" : "../assets/icons/play.svg"
                    width: 16
                    height: 16
                    sourceSize.width: 16
                    sourceSize.height: 16
                    visible: false
                }
                MultiEffect {
                    anchors.fill: playPauseIcon
                    source: playPauseIcon
                    colorization: 1.0
                    colorizationColor: TL.playing ? "black" : "white"
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
                Image {
                    anchors.centerIn: parent
                    source: "../assets/icons/stop.svg"
                    width: 14
                    height: 14
                    sourceSize.width: 14
                    sourceSize.height: 14
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
                Image {
                    anchors.centerIn: parent
                    source: "../assets/icons/arrowback.svg"
                    width: 14
                    height: 14
                    sourceSize.width: 14
                    sourceSize.height: 14
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
                Image {
                    id: nextIcon
                    anchors.centerIn: parent
                    source: "../assets/icons/arrowback.svg"
                    width: 14
                    height: 14
                    sourceSize.width: 14
                    sourceSize.height: 14
                    visible: false
                }
                MultiEffect {
                    anchors.fill: nextIcon
                    source: nextIcon
                    //mirror: true
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
                            height: root.height - 60
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
                                    root.frameMenu.targetIndex = index;
                                    root.frameMenu.popup();
                                }
                            }
                        }
                    }

                    Rectangle {
                        width: 28
                        height: root.height - 60
                        radius: 3
                        color: addHov.containsMouse ? pal.bg4 : pal.bg2

                        Text {
                            anchors.centerIn: parent
                            text: "+"
                            color: pal.dim
                            font.pixelSize: 18
                        }
                        HoverHandler {
                            id: addHov
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
