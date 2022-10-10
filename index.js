let dataInflation;
let selectedItems = [];
const dataFileName = 'data/inflation_data_1010.csv'
const datesList = [
    '17.05.2022',
    '01.06.2022',
    '15.06.2022',
    '01.07.2022',
    '15.07.2022',
    '31.07.2022',
    '16.08.2022',
    '01.09.2022',
    '15.09.2022',
    '01.10.2022'
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
        d3.dsv(',', dataFileName),
    ]).then(function(files){
        onDataLoaded(files)
    })
}

function onDataLoaded(data) {
    dataInflation = data[0]
    dataInflation = completeProductName(dataInflation)
    console.log('here', dataInflation)
    let sortedDataInflation = sortData(dataInflation)
    showGrid(sortedDataInflation)
}

// filter products to show only those in the selected category
function filterProducts() {
    const selectedCategory = document.getElementById('filterCategory').value
    const selectedShop = document.getElementById('filterShop').value

    if (selectedCategory === 'all') {
        showGrid(dataInflation)
    } else {
        let filteredData = dataInflation.filter(function (el) {
            return el['category'] === selectedCategory;
        });
        showGrid(filteredData)
    }
}

function completeProductName(data) {
    for (let i = 0; i < data.length; i++) {
        const productItem = data[i]
        let productName = productItem['product_short']
        const productFull = productItem['product_full']

        if (!productName) {
            productName = productFull
            data[i]['product_short'] = productName
        }
    }
    return data
}

// sort data by product name
function sortData(data) {
    // sort by name
    data.sort((a, b) => {
        const nameA = a['product_short'].toUpperCase(); // ignore upper and lowercase
        const nameB = b['product_short'].toUpperCase(); // ignore upper and lowercase
        if (nameA < nameB) {
            return -1;
        }
        if (nameA > nameB) {
            return 1;
        }

        // names must be equal
        return 0;
    });

    return data
}

function showGrid(data) {
    let gridHTML = '';

    for (let i = 0; i < data.length; i++) {
        const productItem = data[i]
        const productID = productItem['product_id']
        let productName = productItem['product_short']
        const productFull = productItem['product_full']
        let productShop = productItem['shop']
        const productIcon = productItem['icon_id']
        let itemClass;
        let iconClass;

        console.log(productName)

        // show selected items as selected when changing the grid
        if (selectedItems.includes(productID)) {
            itemClass = "grid-item selected-item"
            iconClass = "grid-icon selected-item"
        } else {
            itemClass = "grid-item"
            iconClass = "grid-icon"
        }

        // get image filename for given shop
        if (productShop === 'Migros') {
            productShop = 'migros3.png'
        } else if (productShop === 'Coop') {
            productShop = 'coop2.png'
        }

        if (productID) {
            gridHTML += `
                <div class="${itemClass}" onclick="clickedItem(event, '${productID}')">
                    <img class="grid-info" role="button" onclick="showItemDetails(event, '${productID}')" src="images/info.svg">
                    <img class="grid-shop" src="images/${productShop}">
                    <img class="${iconClass}" src="images/${productIcon}.png" alt="${productID}">
                    <div class="grid-label">${productName}</div>
                </div>`
        }
    }

    gridHTML += `
        <div id="overlay"></div>
            
        <div id="detailsContainer">
            <button id="closeButton" onclick="closeItemDetails()">X</button>
            <div id="itemIcon"></div>
            <div id="detailsTable"></div>
            <div id="priceBox"></div>
            <canvas id="priceChart"></canvas>
        </div>
    `
    document.getElementById('grid-container').innerHTML = gridHTML
    resizeLabelText()
}

// resize labels in the grid according to the width of the grid so the labels don't overflow
function resizeLabelText() {
    Array.from(document.getElementsByClassName('grid-label')).forEach((label) => {
        fitText(label, 0.9)
    })
}

function clickedItem(event, elem) {
    console.log('before ', selectedItems)

    if (!selectedItems.includes(elem)) {
        selectedItems.push(elem)
        event.currentTarget.className = "grid-item selected-item"
        event.currentTarget.getElementsByClassName('grid-icon')[0].className = "grid-icon selected-item"
    } else {
        selectedItems = selectedItems.filter(item => item !== elem)
        event.currentTarget.className = "grid-item"
        event.currentTarget.getElementsByClassName('grid-icon')[0].className = "grid-icon"
    }

    console.log('after ', selectedItems)
}

function showItemDetails(event, elem) {
    // prevent parent div to listen to click event
    event.stopPropagation()

    document.getElementById('overlay').style.display = 'block'
    document.getElementById('detailsContainer').style.display = 'block'
    console.log('clicked', elem)
    const itemData = getItemData(elem)

    const nameFull = itemData['product_full']
    const brand = itemData['brand']
    const quantity = itemData['quantity']
    const shop = itemData['shop']
    const icon = itemData['icon_id']

    const itemIconLoc = document.getElementById('itemIcon')
    itemIconLoc.innerHTML = `<img src="images/${icon}.png" alt="">`

    const detailsTableLoc = document.getElementById('detailsTable')
    detailsTableLoc.innerHTML = `
        <table>
            <tr>
                <td class="detailLabel">Produit</td>
                <td class="detailLabel">Marque</td>
            </tr>
            <tr>
                <td class="detailValue">${nameFull}</td>
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
    // delete previous chart instances
    let chartStatus = Chart.getChart('priceChart'); // <canvas> id
    if (chartStatus) {
        chartStatus.destroy()
    }

    // create chart
    new Chart(
        document.getElementById('priceChart'),
        createChart(itemPrices, changeClass)
    );
}

function closeItemDetails() {
    document.getElementById('overlay').style.display = 'none'
    document.getElementById('detailsContainer').style.display = 'none'
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

    return {
        type: 'line',
        data: dataChart,
        options: {
            scales: {
                yAxis: {
                    min: 0,
                    max: maxY,
                    ticks: {callback: function(value, index, ticks) {
                            return 'CHF ' + value;
                        }}
                },
            },
            plugins: {
                legend: {display: false},
                tooltip: {callbacks: {
                        // format tooltip value to CHF currency
                        label: function(context) {
                            // use label of dataset, here it is "Prix"
                            let label = context.dataset.label || '';
                            // add colon
                            if (label) {
                                label += ': ';
                            }
                            // format the value
                            if (context.parsed.y !== null) {
                                label += new Intl.NumberFormat('CH', { style: 'currency', currency: 'CHF' }).format(context.parsed.y);
                            }
                            return label;
                        }
                    }}
            },
            aspectRatio: 2
        }
    }
}

function getItemData(item) {
    for (const i in dataInflation) {
        const itemObject = dataInflation[i]
        if (itemObject['product_id'] === item) {
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
                priceList[label] = parseFloat(dataValue).toFixed(2)
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

function clearSelection() {
    selectedItems = []
    const items = document.getElementsByClassName('grid-item')
    Array.from(items).forEach((item) => {
        // Do stuff here
        item.className = "grid-item"
        item.getElementsByClassName('grid-icon')[0].className = "grid-icon"
    });
    console.log(selectedItems)
}

function formatDate(date) {
    const [day, month, year] = date.split('.')
    const dateFormatted = new Date(+year, +month - 1, +day);  // month from 0 (jan) to 11 (dec)
    console.log(dateFormatted); // 👉️ Sat Sep 24 2022
}

setup()