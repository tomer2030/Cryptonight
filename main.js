/// <reference path="jquery-3.6.0.js" />

$(() => {
    localStorage.clear(); // any refresh clear the localStorage
    let intervalId = 0; // global variable for the interval id
    let coins = [];
    
    // the first show when the HTML load
    $("section").hide();
    $("#homeSection").show();
    handleCoins();
    
    // the func for every page in the website (every div)
    $("a").on("click", function () {
        const dataSection = $(this).attr("data-section");
        $("section").hide();
        $("#" + dataSection).show();
        
        // kill the interval for report section when it closed
        if(dataSection !== "reportSection"){
            clearInterval(intervalId);
        }
    });
    
    // Home Section:
    // the func for print the cards on the page
    function displayCoins(coins) {
        let content = "";
        for (const coin of coins) {
            const card = createCard(coin);
            content += card;
        }
        $("#homeSection").html(content);
    }    

     // the function for search
    $("#searchCoin").on("keyup", function () {
        const textToSearch = $(this).val().toLowerCase();
        if (textToSearch === "") {
            displayCoins(coins);
        }
        else {
            const filteredCoins = coins.filter(c => c.symbol.indexOf(textToSearch) >= 0);
            if (filteredCoins.length > 0 ) {
                displayCoins(filteredCoins);
            }
            else {
                displayCoins("");
            }
        }
    });

    $(".moreInfoSpan").hide();
    // func for the button "more info" and received the relevant DATA 
    $("#homeSection").on("click", ".card > button", async function () {
        $(this).next().next().slideToggle(250);
        const coinId = $(this).attr("id");
        let content;
        let coin;
        if(localStorage.getItem(coinId) === null){
            const loading = `<span class="loading"></span>`;
            $(this).next().next().html(loading).show();
            setTimeout(async ()=>{
                coin = await getMoreInfo(coinId);
                $(".loading").hide();
                content = `
                &dollar; ${coin.usd} <br>
                &euro; ${coin.euro}  <br>
                &#8362; ${coin.shekel} 
                `;
                $(this).next().next().html(content);
            },500);
        }
        else {
            coin = await getMoreInfo(coinId);
            content = `
            &dollar; ${coin.usd} <br>
            &euro; ${coin.euro}  <br>
            &#8362; ${coin.shekel} 
            `;
            $(this).next().next().html(content);
        }
    });

    // a function for show the coins and do the validation for the Ajax
    async function handleCoins() {
        try {
            coins = await getJSON("https://api.coingecko.com/api/v3/coins");
            displayCoins(coins);
        }
        catch (err) {
            alert(err.message);
        }
    }

    // the function for create a new card with the data from de Ajax
    function createCard(coin) {
        const elected = getFromLocalStorage("electedCoins");
        let checked;
        if(elected !== null){
            for(let i = 0; i < elected.length; i++){
                if(elected[i] === coin.symbol){
                    checked = `checked = true`;
                }
            }
        }
        const card = `
            <div class="col-12 col-sm-4 card text-center form-switch">
                <input class="form-check-input mainCheckbox" type="checkbox" ${checked} value="${coin.symbol}" id="${coin.symbol}">    
                <span class="symbol">${coin.symbol}</span>
                <img src="${coin.image.thumb}" />            
                <hr>
                <span class="name">${coin.name}</span>
                <button class="btn btn-primary" id="${coin.id}">More Info</button>
                <br> 
                <span class = "moreInfoSpan"></span> 
                </div>
                `;
        return card;
    }
    
    // the function for more info and save in Local Storage for 2 min the DATA 
    async function getMoreInfo(coinId) { 
        let priceForCoin = getFromLocalStorage(coinId);
        if(priceForCoin === null){
            let coin = await getJSON("https://api.coingecko.com/api/v3/coins/" + coinId);    
            priceForCoin = {
                usd: coin.market_data.current_price.usd,
                euro: coin.market_data.current_price.eur, 
                shekel: coin.market_data.current_price.ils
            };
            setInLocalStorage(coinId, priceForCoin);
            setTimeout(() => {
                localStorage.removeItem(coinId);
            }, 120000);
        }
        return priceForCoin;
    }
    
    //function for Ajax
    function getJSON(url) {
        return new Promise((resolve, reject) => {
            $.ajax({
                url,
                success: data => {
                    resolve(data);
                },
                error: err => {
                    reject(err);
                }
            });
        });
    }

    // the func for collect the toggle elections 
    let electedCoins = [];
    $("#homeSection").on("change", ".card > input[type=checkbox]",function (){ 
        if(this.checked && electedCoins.length === 5){
            this.checked = false;
            const newCoin = $(this).val();
            showModal(electedCoins, newCoin);
        }
        else{
            if(this.checked){
                electedCoins.push($(this).val());
            }
            else{
                for(let i = 0; i < electedCoins.length; i ++){
                    if ($(this).val() === electedCoins[i]) {
                        electedCoins.splice(i,1);
                    }
                }
            }
        }
        setInLocalStorage("electedCoins", electedCoins);
    })

    // func for filter the elected coins
    $("#filterBox").on("change", function (){
        if(this.checked){
            const elected = getFromLocalStorage("electedCoins");
            if(elected === null || elected.length === 0){
                alert("there is no elected coins");
                this.checked = false;
                return;
            }
            
            let filteredCoins = [];
            for (let i = 0; i < coins.length; i++){
                elected.forEach(element => {
                    if(element === coins[i].symbol){
                        filteredCoins.push(coins[i]);
                    }
                });
            }
            displayCoins(filteredCoins);
        }
        else{
            displayCoins(coins);
        }
    });

    // this function open the modal if the user choose more than 5 coins and shows the elected coins
    function showModal(arr, newCoin){
        let theCoinsElectedHTML = "";
        for(let i = 0; i < arr.length; i++){
            theCoinsElectedHTML += `
                <div class = "form-switch electedCoinModal">
                    <input class="form-check-input electedCoinInput" type="checkbox" checked id="${arr[i]}">
                    <span>${arr[i]}</span>
                </div>
            `;
        }
        $(".electedCoinsModal").html(theCoinsElectedHTML);
        $('.modal').modal('show');

        //this function save the changes and close the modal
        $(".modal input[type=checkbox]").on("change", function () {
            const index = arr.indexOf(this.id);
            const deleteCoin = arr.splice(index, 1);
            arr.push(newCoin);
            setInLocalStorage("electedCoins", arr);
            $(`#${newCoin}`).prop('checked', true);
            $(`#${deleteCoin}`).prop('checked', false);
            $('.modal').modal('hide');
        });              
        
        //this function close the modal without changes
        $(".modal #cancelButton").on("click", function (){
            $('.modal').modal('hide');
        });
        return arr;
    }

    // func for set item in local storage
    function setInLocalStorage(key ,data){
        const json = JSON.stringify(data);
        localStorage.setItem(key, json);
    }

    // func for get array from local storage
    function getFromLocalStorage(key){
        const json = localStorage.getItem(key);
        const arr = JSON.parse(json);
        return arr;
    }

    //Report Section:
    // function for rescue the price in the object
    function getPrice(obj){
        for(const prop in obj){
            if(typeof obj[prop] === "object"){
                getPrice(obj[prop]);
            }
            return obj[prop];
        }
    }

    async function getDataForGraph(){
        const coinsChooseArr = getFromLocalStorage("electedCoins");
        let coinsChoose = "";
        if (coinsChooseArr === null || coinsChooseArr === [] || coinsChooseArr === undefined){
            return -1;
        }
        coinsChooseArr.forEach(e => {
            coinsChoose += `${e},`;
        });
        const url = `https://min-api.cryptocompare.com/data/pricemulti?fsyms=${coinsChoose}&tsyms=USD`;
        const coinsPriceObj = await getJSON(url);
        const data = [];
        const price = [];
        for(const coin in coinsPriceObj){
            const thePrice = getPrice(coinsPriceObj[coin]);
            price.push(thePrice);
        }
        for(let i = 0; i < coinsChooseArr.length; i++){
            data.push ({
                coinName: coinsChooseArr[i],
                coinPrice: price[i]
            });
        }
        return data;
    }
    
    $(".reportLink").on("click", async ()=>{
        $("#reportSection").html(`
            <div id="chartContainer""></div>
        `);
        const errorMessage = `<p class = "ErrorMessage">there is no coins, go back and choose coins</p>`;
        await getDataForGraph()
            .then(data => {
                if(data.Response === "Error" || data === -1) {
                    $("#reportSection").html(errorMessage);
                }
                else{
                    const options = {
                        title:{text: "Cryptonight Live Report"
                    },
                    axisX: {title: "Time"},
                        axisY: {
                            title: "USD value",
                            titleFontColor: "#4F81BC",
                            lineColor: "#4F81BC",
                            labelFontColor: "#4F81BC",
                            tickColor: "#4F81BC"
                        },
                        toolTip: {shared: true},
                        legend: {
                            cursor: "pointer",
                            itemclick: toggleDataSeries
                        },
                        data: []
                    };
                    for(let i = 0; i < data.length; i++){
                        options.data[i] = {
                            type: "spline",
                            name: data[i].coinName,
                            showInLegend: true,
                            xValueFormatString:"",
                            yValueFormatString: "$###,###.###",
                            dataPoints: []
                        }
                    }
                    $("#chartContainer").CanvasJSChart(options);
                    
                    // new data every 2 sec
                    intervalId = setInterval(() => {  
                        let date = new Date();
                        for(let i = 0; i < data.length; i++){
                            options.data[i].dataPoints.push({x: date,y: data[i].coinPrice});
                        }
                        $("#chartContainer").CanvasJSChart(options);
                    }, 2000);
                }
                
                function toggleDataSeries(e) {
                    if (typeof (e.dataSeries.visible) === "undefined" || e.dataSeries.visible) {
                        e.dataSeries.visible = false;
                    } else {
                        e.dataSeries.visible = true;
                    }
                    e.chart.render();
                }
            })
            .catch(()=> {
                $("#reportSection").html(errorMessage);
                return;
            });
    });
    
    // About Section:
    $("#aboutSection").html(`
    <div class = "aboutBox">
        <h3>About me: Tomer Viner</h3>
        <div class = "aboutData">
            <p>My name is Tomer. I live in Gan Yavne. I am 23 years old</p>
            <p>I was born in Kfar Saba and lived in Ashdod. I have diabetes since I was 7 years old</p>
            <p>Today, I am an officer in intelligence</p>
            <div>
                <span>I know a few technologies: </span>
                <li>HTML</li>
                <li>CSS</li>
                <li>JavaScript</li>
                <li>jQuary</li>
                <li>Bootstrap</li>
                <li>TypeScript</li>
                <li>React</li>
            </div>
            <p>My Project is about cryptonight. In the project, the user can see the actual value for a lot of crypto coins. Also, the user can choose 5 coins and compare between them in a live report, over a graph</p>
        </div>
        <img src="assets/images/me.jpg">
    </div>
    `);
});