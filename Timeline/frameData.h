#ifndef FRAMEDATA_H
#define FRAMEDATA_H

#include <QImage>

namespace Anima {

struct Frame {
    QImage image;

    Frame(int w, int h)
        : image(w, h, QImage::Format_ARGB32_Premultiplied)
    {
        image.fill(Qt::transparent);
    }

    Frame(const Frame& o) : image(o.image.copy()) {}
    Frame& operator=(const Frame& o) { image = o.image.copy(); return *this; }
};

}

#endif // FRAMEDATA_H