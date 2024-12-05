window.api.getIp().then((ip) => {
    var qrcode = document.getElementById("qrcode")
    if (ip) {
        qrcode.innerText = ip;
    }
    else qrcode.innerText = "Hello";
    new QRCode(qrcode, {
        text: ip,
        width: 256,
        height: 256,
        colorDark: "#000000",
        colorLight: "#ffffff",
        correctLevel: QRCode.CorrectLevel.H
    });
});
