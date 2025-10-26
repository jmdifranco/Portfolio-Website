

//Wires up Prev/Next buttons and exposes callbacks
class CarouselControls{
    constructor (prevSelector, nextSelector, {onPrev, onNext}){
        this.prevBtn = document.querySelector(prevSelector);
        this.nextBtn = document.querySelector(nextSelector);

        if(!this.prevBtn || !this.nextBtn){
            throw new Error("CarouselControls: prev/next buttons not founds.") //just throws error if no next 
        }

        this.prevBtn.addEventListener("click", (e)=>{  //Event listener for right button
            e.preventDefault();
            onPrev && onPrev();
        });

        this.nextBtn.addEventListener("click", (e)=>{ //Event listener for left button
            e.preventDefault();
            onNext && onNext();
        });
    }
}

//The main Carousel class
//Manages index, the project movemnet, resize
class Carousel{
    constructor({trackSelector, viewportSelector, prevSelector, nextSelector, }){
        this.track = document.querySelector(trackSelector);
        this.viewport = document.querySelector(viewportSelector);
        this.slides = Array.from(this.track?.children || []);

        if (!this.track || !this.viewport || this.slides.length == 0){
            throw new Error("CarouselMain: missing viewport or slides");
        }

        
        this.index = 0; //current slide
        this.gap = 60; // pixel gap between side postions
        this.sideScale = 0.8; // shrinks side slides


        //creates control buttons
        this.controls = new CarouselControls(prevSelector, nextSelector, {onPrev: () => this.prev(),   onNext: () => this.next()});
        
       
        // helps input
        document.addEventListener("keydown", (e) => this.handleKey(e));
        window.addEventListener("resize", (e) => this.update());

        //Intial render
        this.update();  
    }

    //compute distance to current
    distanceToCurrent(i){
        const n = this.slides.length;
        let d = i - this.index;
        if(d > n/2) { d -= n;} // slide on right side
        if(d < -n/2) {d += n;} //slide on left side
        return d
    }

    slideWidth(){
        return this.slides[0].getBoundingClientRect().width;
    }

    //update each change
    update(){
        const cardW = this.slideWidth();
        const step = Math.round(cardW*0.6) + this.gap;

        this.slides.forEach((slide, i) => {
            const distance = this.distanceToCurrent(i);
            const isCenter = (distance ==0); // when distance = 0 thats the center
            const isNeighbor = (Math.abs(distance) == 1);
            
            slide.classList.toggle("is-current", isCenter);
            slide.classList.toggle("is-side", !isCenter && isNeighbor);
            slide.classList.toggle("is-hidden", !(isCenter || isNeighbor));


            //Translation each slide
            //then apply scale and a tiny rotation for effect

            const x = distance*step;
            const scale = isCenter ? 1: this.sideScale;
            const rotateY = isCenter ? 0: (distance>0 ? -10: 10); //helps lean towards center

            //css to animate each slide
            slide.style.transform = `translateX(calc(-50% + ${x}px)) scale(${scale}) rotateY(${rotateY}deg)`;
            slide.style.zIndex = String(10 - Math.abs(distance));

        });
    }

    //changes index
    goTo(i){
        const n = this.slides.length;
        const prevIndex = this.index;
        this.index = (i+n) % n;

        if(this.index != prevIndex){
            document.dispatchEvent(new CustomEvent("carousel:slidechange", { //creates a new event function that lets the project know the slide has changed
                detail: { index: this.index}
            }));
        }


        this.update();
    }


    //moves for next or previous
    next() {this.goTo(this.index+1);}
    prev(){this.goTo(this.index-1);}

    handleKey(e){
        if(e.key == "ArrowRight") this.next();
        if(e.key == "ArrowLeft") this.prev();
    }


    
}

//Exposes to rest of the project
window.Carousel = Carousel;

//Making the see more sections hide
// hidden sections smooth scroll + animations
    
    //document event listener adds event for whole page, 
    //DOMContentLoaded It ensures your code runs after all HTML elements are loaded, preventing null references
    document.addEventListener("DOMContentLoaded", () =>{
        const seeMoreLinks = document.querySelectorAll(".see-more");
        const detailSections = document.querySelectorAll(".project-details");
        const backLinks = document.querySelectorAll(".back-to-projects");
        const projectsSection = document.querySelector("#projects");

        //function to hide sections
        function hideAllDetails(){
            detailSections.forEach(sec => {
                sec.classList.remove("active");
                sec.classList.remove("closing");
                sec.style.display = "none";
            })
        }

        function closeOpenDetails({scrollToProjects = false, animate = true} = {}){
            const open = document.querySelector(".project-details.active");
            if(!open){
                if(scrollToProjects){
                    projectsSection.scrollIntoView({behavior: "smooth", block: "start"});
                }
                return;
            }

            open.classList.remove("active");
            if(!animate){
                open.style.display = "none";
                if(scrollToProjects){
                    projectsSection.scrollIntoView({behavior: "smooth", block: "start"});
                }
                return;
            }

            open.classList.add("closing"); //playes shrinkOut
            const onEnd = () =>{
                open.removeEventListener("animationend", onEnd);
                open.classList.remove("closing");
                open.style.display = "none";
                if(scrollToProjects){
                projectsSection.scrollIntoView({behavior: "smooth", block: "start"});
                }
            };
            open.addEventListener("animationend", onEnd); //finishes animation

        }

        //hides all then opens selected
        function openDetails(targetId){
            hideAllDetails();
            const sec = document.querySelector(targetId); // picks one card at a time
            if(!sec) return;

            sec.style.display = "block"; // ensure it can animate

            sec.offsetHeight;
            sec.classList.add("active");
            sec.scrollIntoView({behavior:"smooth", block: "start"});
        }

        //smooth transtions to see more
        function closeCurrentAndScrollUp(){
            const open = document.querySelector(".project-details.active");
            if(!open){
                projectsSection.scrollIntoView({behavior: "smooth", block: "start"});
                return;
            }

            open.classList.remove("active");
            open.classList.add("closing"); //playes shrinkOut

            //closing see more section
            const onEnd = () =>{
                open.removeEventListener("animationend", onEnd);
                open.classList.remove("closing");
                open.style.display = "none";
                projectsSection.scrollIntoView({behavior: "smooth", block: "start"});
            };
            open.addEventListener("animationend", onEnd); //finishes animation

        }

        seeMoreLinks.forEach(link => {
            link.addEventListener("click", e => {
                e.preventDefault();

                //Show only the selected one
                const targetId = link.getAttribute("href"); //section we want to show
                openDetails(targetId); //opens see more
            });
        });

        backLinks.forEach(link => {
            link.addEventListener("click", e =>{
                e.preventDefault();
                closeCurrentAndScrollUp(); //closes the see more
            });
        });


        //for when slide changes
        document.addEventListener("carousel:slidechange", () =>{
            closeOpenDetails({ scrollToProjects: false, animate:true});
        });

    });

    
    