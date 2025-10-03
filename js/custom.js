/*-------Date function---------
-----------------------------*/

const year = new Date().getFullYear()
document.getElementById("date").innerHTML = year

/* whatsapp popup button 
     -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- */

document.addEventListener("DOMContentLoaded", function () {
  const whatsappBtn = document.getElementById("whatsappBtn");
  const chatBox = document.getElementById("chatBox");
  const whatsappText = document.getElementById("whatsappText");

  let isOpen = false;

  whatsappBtn.addEventListener("click", function () {
    isOpen = !isOpen;

    if (isOpen) {
      // Show chat box + change to close icon
      chatBox.classList.add("show");
    //   chatBox.style.display = "block";
      whatsappBtn.innerHTML = '<i class="bi bi-x-lg icon-spin"></i>';
      whatsappBtn.style.backgroundColor = "red";
      whatsappText.classList.add("hide");
    //   whatsappText.style.display = "none";
    } else {
      // Hide chat box + revert to WhatsApp icon
      chatBox.classList.remove("show");
    //   chatBox.style.display = "none";
      whatsappBtn.innerHTML = '<i class="bi bi-whatsapp icon-spin-reverse"></i>';
      whatsappBtn.style.backgroundColor = "#25D366";
    //   whatsappText.style.display = "block";
      whatsappText.classList.remove("hide");
    }
  });
});

document.getElementById("whatsappForm").addEventListener("submit", function(e){
    e.preventDefault();

    let name = document.getElementById("whatsapp-Name").value.trim();
    let serviceType = document.getElementById("whatsapp-Email").value.trim();
    let message = document.getElementById("whatsapp-Message").value;

  if(name && message && serviceType){
    let whatsappMsg = `Hello, my name is ${name}. %0A` +
                      `Email: ${serviceType} %0A` +
                      `Message: ${message}`;

    let phoneNumber = "917358183156";
    window.open(`https://wa.me/${phoneNumber}?text=${whatsappMsg}`, "_blank");
    }
})