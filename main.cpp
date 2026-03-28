#include <QGuiApplication>
#include <QQmlApplicationEngine>
#include <QQuickStyle>
#include "engine.h"
#include "canvasprovider.h"

int main(int argc, char* argv[]) {
    QGuiApplication app(argc, argv);
    QQuickStyle::setStyle("Basic");

    Engine animaEngine;

    QQmlApplicationEngine qmlEngine;
    qmlRegisterSingletonInstance("Anima.Backend",    1, 0, "MainEngine", &animaEngine);
    qmlRegisterSingletonInstance("Anima.Backend",    1, 0, "TL",         animaEngine.timeline());
    qmlRegisterType<CanvasProvider>("Anima.Components", 1, 0, "DrawingCanvas");

    QObject::connect(&qmlEngine, &QQmlApplicationEngine::objectCreationFailed,
                     &app, []{ QCoreApplication::exit(-1); }, Qt::QueuedConnection);

    qmlEngine.loadFromModule("Anima_Pro", "Main");
    return QCoreApplication::exec();
}