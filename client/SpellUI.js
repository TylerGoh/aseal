var spell_canvas = document.getElementById("spellCanvas");
var spellDiv = document.getElementById("spellDiv");
var hold2_on = false;
var hold2x = 0;
var hold2y = 0;
var spell_x_old = 0;
var spell_y_old = 0;
var spell_x = 274;
var spell_y = 0;
SpellUI = function(){
    var ctx_spell = spell_canvas.getContext("2d");
    ctx_spell.clearRect(0,0,500,500)
    ctx_spell.drawImage(Img.spell,0,0);
}

spell_canvas.onmousedown = function (event) {
    if(event.button == 0)
    {
        if(event.clientY < spell_y+50)
        {
            if(event.clientX>spell_x+240 && event.clientY < spell_y+25)
            {
                spellDiv.style.display = "none";
            }
            else
            {
            document.getElementById("invCanvas").style.zIndex = 1;
            document.getElementById("spellCanvas").style.zIndex = 2;    
            spell_x_old = spell_x;
            spell_y_old = spell_y;
            hold2x = event.clientX;
            hold2y = event.clientY;
            hold2_on = true;
            }
        }
    }   
}
spell_canvas.onmouseup = function (event) {
    hold2_on = false;
}


document.addEventListener("mousemove",function(event){
    if(hold2_on == true)
    {
        spell_x = spell_x_old + event.clientX - hold2x;
        spell_canvas.style.left=spell_x;
        spell_y = spell_y_old + event.clientY - hold2y;
        spell_canvas.style.top=spell_y;
    }
});
