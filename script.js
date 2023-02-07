////////////////
// helpers
////////////////

function getDistance(obj1, obj2) {
  return Math.floor(
    Math.sqrt(Math.pow(obj1.cx - obj2.cx, 2) + Math.pow(obj1.cy - obj2.cy, 2))
  );
}

function getRandomArbitrary(min, max) {
  return Math.floor(Math.random() * (max - min) + min);
}

function comparator(a, b) {
  if (a[1] < b[1]) return -1;
  if (a[1] > b[1]) return 1;
  return 0;
}

function difference(source, toRemove) {
  return source.filter(function(value) {
    return toRemove.indexOf(value) == -1;
  });
}

////////////////
// global vars
////////////////

var svg = document.getElementById("svg");
var dotMatrix = document.createElementNS(
  "http://www.w3.org/2000/svg",
  "circle"
);
var lineMatrix = document.createElementNS("http://www.w3.org/2000/svg", "line");
var screenW = window.innerWidth;
var screenH = window.innerHeight;
var totalDist = document.getElementById("distance");

////////////////
// line constructor
////////////////

function Line(x1, y1, x2, y2) {
  this.x1 = x1;
  this.y1 = y1;
  this.x2 = x2;
  this.y2 = y2;
  this.el = document.createElementNS("http://www.w3.org/2000/svg", "line");
  this.class = "line";
  this.update = function(x1, y1, x2, y2) {
    this.el.setAttribute("x1", x1 || this.x1);
    this.el.setAttribute("y1", y1 || this.y1);
    this.el.setAttribute("x2", x2 || this.x2);
    this.el.setAttribute("y2", y2 || this.y2);
    this.setAttr("class", this.class);
  };
  this.setAttr = function(attr, value) {
    this.el.setAttribute(attr, value);
  };
  this.append = function() {
    svg.insertBefore(this.el, svg.firstChild);
  };
}

////////////////
// dot constructor
////////////////

function Dot(r, cx, cy) {
  this.r = r;
  this.cx = cx;
  this.cy = cy;
  this.el = document.createElementNS("http://www.w3.org/2000/svg", "circle");
  this.class = "dot";
  this.update = function() {
    this.el.setAttribute("r", this.r);
    this.el.setAttribute("cx", this.cx);
    this.el.setAttribute("cy", this.cy);
    this.setAttr("class", this.class);
  };

  // activates a dot
  this.activate = function() {
    for (i = 0; i < dots.num; i++) {
      dots.list[i].setAttr("data-selected", "false");
    }
    this.setAttr("data-selected", "true");
  };

  this.visited = function() {
    this.setAttr("data-visited", "true");
  };

  // sets attribute to element
  this.setAttr = function(attr, value) {
    this.el.setAttribute(attr, value);
  };

  // gets attribute to element
  this.getAttr = function(attr) {
    return this.el.getAttribute(attr);
  };

  // appends element to svg and attaches event listeners
  this.append = function() {
    svg.appendChild(this.el);
    this.el.addEventListener("click", this.onClick);
  };

  // on click on element
  this.onClick = function(event) {
    //gets the id and the coords of the dot
    var thisId = Number(event.target.getAttribute("data-id").substr(3, 2));
    var thisCx = dots.list[thisId].cx;
    var thisCy = dots.list[thisId].cy;

    // calculates the distance between dots
    var distances = [];
    for (i = 0; i < dots.num; i++) {
      distances[i] = [i, getDistance(dots.selected, dots.list[i])];
    }
    distances.sort(comparator);
    distances.splice(0, 1);
    var distancesLeft = [];
    for (i = 0; i < distances.length; i++) {
      if (dots.left.includes(distances[i][0])) {
        distancesLeft.push(distances[i][0]);
      }
    }

    //if the element is the nearest
    if (thisId == distancesLeft[0] && dots.left.includes(thisId)) {
      // calculates distances
      var newDistance = getDistance(dots.list[thisId], dots.selected);

      app.score.update(1); // punteggio x numero di poi
      // app.score.update(newDistance); punteggio x distanza

      //sets the active class to the selected dot
      dots.list[thisId].activate();
      dots.list[thisId].visited();

      // creates the line
      lines.list.push(
        new Line(
          dots.selected.cx,
          dots.selected.cy,
          dots.list[thisId].cx,
          dots.list[thisId].cy
        )
      );
      lines.list[lines.list.length - 1].update();
      lines.list[lines.list.length - 1].append();

      // creates the preview line
      //TODO: eliminare le vecchie preline che rimangono vive

      svg.addEventListener("mousemove", function prelineMove(e) {
        mouseX = e.pageX;
        mouseY = e.pageY;
        app.preline.update(thisCx, thisCy, mouseX, mouseY);
      });

      //saves the selected dots coordinates
      dots.selected.id = thisId;
      dots.selected.cx = thisCx;
      dots.selected.cy = thisCy;

      //removes the dot from the list of remaining dots
      for (i = 0; i < dots.left.length; i++) {
        if (dots.left[i] === thisId) {
          dots.left.splice(i, 1);
        }
      }

      if (dots.left.length == 0) {
        app.end(true);
      }
    } else {
      app.end(false);
    }
  };
}

////////////////
// lines group
////////////////

var lines = {
  list: []
};

////////////////
// dots group
////////////////

var dots = {};
dots.num = 20;
dots.list = [];
dots.start = 0;
dots.selected = {};
dots.selected.id = dots.start;
dots.left = [];
dots.preline;

////////////////
// app
////////////////

var app = {};

app.level = 4;

app.score = {};
app.score.number = 0;
app.score.el = document.getElementById("score");
app.score.update = function(score) {
  app.score.number += score;
  app.score.el.textContent = app.score.number;
};

app.score.reset = function() {
  app.score.number = 0;
  app.score.update(0);
};

app.results = function(points) {
  if (points == "reset") {
    sessionStorage.setItem("results", 0);
  } else {
    if (!sessionStorage.getItem("results")) {
      sessionStorage.setItem("results", points);
    } else {
      var newscore = parseInt(sessionStorage.getItem("results")) + points;
      sessionStorage.setItem("results", newscore);
    }
  }
};

app.launchScreen = function(lastScore, title, description, btnText) {
  app.launchScreen.el = document.getElementById("launch-screen");
  app.launchScreen.el.setAttribute("class", "is-visible");

  var launchScreenTitle = document.getElementById("launch-screen__title");
  launchScreenTitle.textContent = title;

  var launchScreenDescription = document.getElementById(
    "launch-screen__description"
  );
  launchScreenDescription.textContent = description;

  app.launchScreen.btn = document.getElementById("start-btn");
  app.launchScreen.btn.textContent = btnText;

  app.launchScreen.btn.addEventListener("click", function lauch() {
    app.launchScreen.el.setAttribute("class", "");
    app.start(app.level);
    app.launchScreen.btn.removeEventListener("click", lauch);
  });
};

app.preline = new Line(0, 0, 200, 200);
app.preline.setAttr("id", "preline");

app.start = function(dotsNum) {
  dots.num = dotsNum;

  for (i = 0; i < dots.num; i++) {
    var cx = getRandomArbitrary(10, screenW - 10);
    var cy = getRandomArbitrary(10, screenH - 10);

    dots.list[i] = new Dot(8, cx, cy);
    dots.list[i].setAttr("data-id", "id-" + i);
    dots.list[i].setAttr(
      "style", 
      "animation-delay:" + i / 10 + "s; transform-origin: " + cx + 'px ' + cy + 'px;');
    dots.list[i].update();
    dots.list[i].append();
    dots.left.push(i);

    if (i == dots.start) {
      dots.selected.cx = dots.list[dots.start].cx;
      dots.selected.cy = dots.list[dots.start].cy;
      dots.list[dots.start].setAttr("class", "dot dot--starting");
      dots.left.splice(i, 1);
    }

    // adds the preline

    app.preline.update(
      dots.selected.cx,
      dots.selected.cy,
      dots.selected.cx,
      dots.selected.cy
    );
    app.preline.append();

    svg.addEventListener("mousemove", function prelineMove(e) {
      mouseX = e.pageX;
      mouseY = e.pageY;
      app.preline.update(dots.selected.cx, dots.selected.cy, mouseX, mouseY);
    });
  }

  // sets starting point
  dots.list[dots.start].setAttr("data-selected", "true");
};

app.end = function(win) {
  if (win) {
    app.level += 4;
    app.results(app.score.number);
  } else {
    app.level = 4;
  }

  dots.list = [];
  dots.selected = {};
  dots.left.length = 0;
  svg.innerHTML = "";

  if (win) {
    app.launchScreen(
      app.score.number,
      "Well done!",
      "Your score is: " + sessionStorage.getItem("results") + ' The next level will be harder.',
      "PLAY NEXT LEVEL"
    );
  } else {
    app.launchScreen(
      0,
      "Game over!",
      "Your final score is: " + sessionStorage.getItem("results"),
      "PLAY AGAIN"
    );
    app.results("reset");
    app.score.reset();
  }
};

app.launchScreen(
  0,
  "Path finder by Aniruddh",
  "Find the nearest yellow dot.",
  "PLAY"
);