let dataInflation;
const datesList = [
    '17.05.22',
    '01.06.22',
    '15.06.22',
    '01.07.22',
    '15.07.22',
    '31.07.22',
    '16.08.22',
    '15.09.22',
]

function setup () {
    // Charger les données (Attention: opération asynchrone !)
    loadData();
}

function loadData() {
    // Attention, il s'agit d'une opération asynchrone !
    // Une fois les données chargées, la promise sera résolue (.then) et
    // le callback `onDataLoaded` sera appelé en passant les données en paramètre
    Promise.all([
        d3.dsv(';','data/inflation_data.csv'),
    ]).then(function(files){
        onDataLoaded(files)
    })
}

function onDataLoaded(data) {
    dataInflation = data[0]
    console.log(dataInflation)
    getItemData('aubergine')
}

function formatDate(date) {
    const [day, month, year] = date.split('.')
    const dateFormatted = new Date(+year, +month - 1, +day);  // month from 0 (jan) to 11 (dec)
    console.log(dateFormatted); // 👉️ Sat Sep 24 2022
}

function getItemData(item) {
    for (const i in dataInflation) {
        const itemObject = dataInflation[i]
        if (itemObject.id === item) {
            console.log(itemObject)
            return itemObject
        } else {
            console.log('item not found')
        }
    }
}

function getItemPrices(data) {
    let priceList = {};

    for (const label in data) {
        if (datesList.includes(label)) {
            const dataValue = data[label]
            if (dataValue) {
                priceList[label] = parseFloat(dataValue.replace(',', '.')).toFixed(2)
            } else {
                priceList[label] = null
            }
        }
    }
    return priceList
}

function getItemEarliestPrice(priceData) {
    for (const i in datesList) {
        const date = datesList[i]
        if (priceData[date]) {
            return priceData[date]
        }
    }
}

function getItemLatestPrice(priceData) {
    for (let i = datesList.length - 1; i > -1 ; i--) {
        const date = datesList[i]
        if (priceData[date]) {
            return priceData[date]
        }
    }
}

function createChart(itemPrices, changeClass) {
    let color = 'black'

    if (changeClass === 'increased') {
        color = 'red'
    } else if (changeClass === 'decreased') {
        color = 'green'
    }

    let pricesArray = Object.values(itemPrices);
    let maxPrice = Math.max(...pricesArray);
    let maxY = Math.round(maxPrice + 3)


    const dataChart = {
        datasets: [{
            label: 'Prix',
            backgroundColor: color,
            borderColor: color,
            data: itemPrices,
            spanGaps: true,
        }]
    };

    const config = {
        type: 'line',
        data: dataChart,
        options: {
            scales: {
                yAxis: {min: 0, max: maxY}
            },
            plugins: {
                legend: {
                    display:false
                }
            }
        }
    };

    return config
}

function clickedItem(item) {
    document.getElementById('overlay').style.display = 'block'
    document.getElementById('detailsContainer').style.display = 'block'
    console.log('clicked', item)
    const itemData = getItemData(item)

    console.log(Chart.instances)

    const product = itemData['product']
    const brand = itemData['brand']
    const quantity = itemData['quantity']
    const shop = itemData['shop']

    const itemIconLoc = document.getElementById('itemIcon')
    itemIconLoc.innerHTML = `<img src="images/${item}.png" alt="">`

    const detailsTableLoc = document.getElementById('detailsTable')
    detailsTableLoc.innerHTML = `
        <table>
            <tr>
                <td class="detailLabel">Produit</td>
                <td class="detailLabel">Marque</td>
            </tr>
            <tr>
                <td class="detailValue">${product}</td>
                <td class="detailValue">${brand}</td>
            </tr>
            <tr>
                <td class="detailLabel">Quantité</td>
                <td class="detailLabel">Magasin</td>
            </tr>
            <tr>
                <td class="detailValue">${quantity}</td>
                <td class="detailValue">${shop}</td>
            </tr>
        </table>
    `

    const itemPrices = getItemPrices(itemData)
    const itemEarliestPrice = getItemEarliestPrice(itemPrices)
    const itemLatestPrice = getItemLatestPrice(itemPrices)
    const priceDiff = (itemLatestPrice - itemEarliestPrice).toFixed(2)
    const percentDiff = Math.round(itemLatestPrice / itemEarliestPrice * 100 - 100)
    console.log(itemEarliestPrice, itemLatestPrice, priceDiff, percentDiff)

    let changeClass = ''
    if (priceDiff > 0) {
        changeClass = 'increased'
    } else if (priceDiff < 0) {
        changeClass = 'decreased'
    }

    const priceBoxLoc = document.getElementById('priceBox')
    priceBoxLoc.innerHTML = `
        <div class="priceDetails">
            <div class="priceLabel">Prix initial</div>
            <div class="priceValue">${itemEarliestPrice} CHF</div>
        </div>
        <div class="priceDetails">
            <div class="priceLabel">Prix actuel</div>
            <div class="priceValue">${itemLatestPrice} CHF</div>
        </div>
        <div class="priceDetails">
            <div class="priceLabel">Evol. du prix</div>
            <div class="priceValue ${changeClass}">${priceDiff} CHF</div>
        </div>
        <div class="priceDetails">
            <div class="priceLabel">Evol. en %</div>
            <div class="priceValue ${changeClass}">${percentDiff} %</div>
        </div>
    `
    let chartStatus = Chart.getChart('priceChart'); // <canvas> id
    console.log(chartStatus)
    if (chartStatus) {
        chartStatus.destroy()
    }

    const myChart = new Chart(
        document.getElementById('priceChart'),
        createChart(itemPrices, changeClass)
    );
}

function closeDetailsWindow() {
    document.getElementById('overlay').style.display = 'none'
    document.getElementById('detailsContainer').style.display = 'none'
}

setup()