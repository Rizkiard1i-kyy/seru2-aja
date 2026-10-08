
/* =====================================
   BISING! CLUB
   DATA FOTO DAN VIDEO
===================================== */

/* 143 FOTO */

const PHOTOS = Array.from(
    { length: 143 },
    (_, index) => {
        const number = String(index + 1).padStart(2, "0");

        return {
            id: index,
            file: `foto-${number}.jpg`,
            src: `aset/image/foto-${number}.jpg`,
            title: `FOTO ${number}`,
            category: "rame",
            type: "foto"
        };
    }
);

/* 51 VIDEO */

const VIDEOS = Array.from(
    { length: 51 },
    (_, index) => {
        const number = String(index + 1).padStart(2, "0");

        return {
            id: index,
            file: `video-${number}.mp4`,
            src: `aset/video/video-${number}.mp4`,
            title: `VIDEO ${number}`,
            category: "video",
            type: "video"
        };
    }
);

/* GABUNG SEMUA MEDIA */

const MEDIA = [
    ...PHOTOS,
    ...VIDEOS
];
