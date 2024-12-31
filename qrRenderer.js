window.api.getIp().then((ip) => {
    var qrcode = document.getElementById("qrcode")
    if (!ip) {
        qrcode.innerText = "Service is initialising. Try again in a bit";
    }
    new QRCode(qrcode, {
        text: ip,
        width: 256,
        height: 256,
        colorDark: "#000000",
        colorLight: "#ffffff",
        correctLevel: QRCode.CorrectLevel.H
    });
});

const submit = document.getElementById("submit");
const domain_elem = document.getElementById("domain");
const authtoken_elem = document.getElementById("authtoken");
window.api.getTunnelInfo().then(({domain, authtoken}) => {
    console.log("Got:", domain, authtoken);
    domain_elem.value = domain;
    authtoken_elem.value = authtoken;
})
submit.addEventListener('click', () => {
    window.api.setTunnelInfo(domain_elem.value, authtoken_elem.value)
})
