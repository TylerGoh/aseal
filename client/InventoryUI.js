var inv_canvas = document.getElementById("invCanvas");
var invDiv = document.getElementById("inventoryDiv");
var hold_on = false;
var holdx = 0;
var holdy = 0;
var inv_x_old = 0;
var inv_y_old = 0;
var inv_x = 0;
var inv_y = 0;
InventoryUI = function(){
    var ctx_inv = inv_canvas.getContext("2d");
    ctx_inv.clearRect(0,0,500,500)
    ctx_inv.drawImage(Img.inventory,0,0);
}

inv_canvas.onmousedown = function (event) {
    if(event.button == 0)
    {
        if(event.clientY < inv_y+50)
        {
            if(event.clientX>inv_x+240 && event.clientY < inv_y+25)
            {
                invDiv.style.display = "none";
            }
            else
            {
            document.getElementById("invCanvas").style.zIndex = 2;
            document.getElementById("spellCanvas").style.zIndex = 1;    
            inv_x_old = inv_x;
            inv_y_old = inv_y;
            holdx = event.clientX;
            holdy = event.clientY;
            hold_on = true;
            }
        }
    }   
}
inv_canvas.onmouseup = function (event) {
    hold_on = false;
}

document.addEventListener("mousemove",function(event){
    if(hold_on == true)
    {   
        inv_x = inv_x_old + event.clientX - holdx;
        inv_canvas.style.left=inv_x;
        inv_y = inv_y_old + event.clientY - holdy;
        inv_canvas.style.top=inv_y;
    }
})


