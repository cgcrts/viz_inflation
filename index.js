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
    dataInflation = sortData(dataInflation)
    showGrid(dataInflation)
    generateReceiptDetails()
    //showItemDetails(null, 'aubergine_coop')
}

// filter products to show only those in the selected category
function filterProducts() {
    const selectedCategory = document.getElementById('filterCategory').value
    const selectedShop = document.getElementById('filterShop').value

    if (selectedCategory === 'all' && selectedShop === 'all') {
        showGrid(dataInflation)
    } else if (selectedShop === 'all') {
        let filteredData = dataInflation.filter(function (elem) {
            return elem['category'] === selectedCategory;
        });
        showGrid(filteredData)
    } else if (selectedCategory === 'all') {
        let filteredData = dataInflation.filter(function (elem) {
            return elem['shop'] === selectedShop;
        });
        showGrid(filteredData)
    } else {
        let filteredData = dataInflation.filter(function (elem) {
            return elem['shop'] === selectedShop;
        });
        filteredData = filteredData.filter(function (elem) {
            return elem['category'] === selectedCategory;
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
            productShop = 'shop_migros.png'
        } else if (productShop === 'Coop') {
            productShop = 'shop_coop.png'
        }

        if (productID) {
            gridHTML += `
                <div class="${itemClass}" onclick="clickedItem(event, '${productID}')" id="${productID}">
                    <img 
                        class="grid-info" 
                        role="button" 
                        onclick="showItemDetails(event, '${productID}')" 
                        src="images/info.svg"
                        alt="info icon">
                    <img class="grid-shop" src="images/${productShop}" alt="${productShop}">
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
        populateReceipt()
        event.currentTarget.className = "grid-item selected-item"
        event.currentTarget.getElementsByClassName('grid-icon')[0].className = "grid-icon selected-item"
    } else {
        selectedItems = selectedItems.filter(item => item !== elem)
        populateReceipt()
        event.currentTarget.className = "grid-item"
        event.currentTarget.getElementsByClassName('grid-icon')[0].className = "grid-icon"
    }

    console.log('after ', selectedItems)
}

function showItemDetails(event, elem) {
    if (event) {
        // prevent parent div to listen to click event
        event.stopPropagation()
    }

    document.getElementById('overlay').style.display = 'block'
    document.getElementById('detailsContainer').style.display = 'block'
    console.log('clicked', elem)
    const itemData = getItemData(elem)

    const nameFull = itemData['product_full']
    const brand = itemData['brand']
    const quantity = itemData['quantity']
    const shop = 'shop_' + itemData['shop'].toLowerCase()
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
                <td class="detailValue"><img src="images/${shop}.png" alt="${shop}"></td>
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

function selectAll() {
    let itemsList = document.getElementsByClassName('grid-item')
    console.log(itemsList)

    for (let i = 0; i < itemsList.length; i++) {
        const item = itemsList[i]
        console.log(item)
        const productID = item.id

        if (!selectedItems.includes(productID)) {
            selectedItems.push(productID)
            populateReceipt()
            item.className = "grid-item selected-item"
            item.getElementsByClassName('grid-icon')[0].className = "grid-icon selected-item"
        }
    }
}

function clearSelection() {
    selectedItems = []
    const itemsInGrid = document.getElementsByClassName('grid-item')
    const itemsOnReceipt = document.getElementById('receipt-items')
    const evolutionOnReceipt = document.getElementById('receipt-evolution')

    Array.from(itemsInGrid).forEach((item) => {
        // Do stuff here
        item.className = "grid-item"
        item.getElementsByClassName('grid-icon')[0].className = "grid-icon"
    });

    itemsOnReceipt.innerHTML = 'Aucun produit sélectionné'
    evolutionOnReceipt.innerHTML = ''
    console.log(selectedItems)
}

function formatDate(date) {
    const [day, month, year] = date.split('.')
    const dateFormatted = new Date(+year, +month - 1, +day);  // month from 0 (jan) to 11 (dec)
    console.log(dateFormatted); // 👉️ Sat Sep 24 2022
}

function generateReceiptDetails() {

    // get today's date for receipt
    const dateOnReceipt = document.getElementById('receipt-date')
    let d = new Date()
    let minute = d.getMinutes()
    let hour = d.getHours()
    let day = d.getDate()
    let month = d.getMonth() + 1
    let year = d.getFullYear()

    if (minute < 10) {
        minute = '0' + minute
    }

    dateOnReceipt.innerHTML = `${hour}:${minute} - ${day}.${month}.${year}`

    // generate random barcode for receipt
    function randomMinMax(min, max) {
        return Math.floor(Math.random() * max) + min;
    }
    //make 18 digit barcode
    // 4 4 4 4 2
    document.getElementById('receipt-barcode').innerHTML = `
        ${randomMinMax(1000, 9000)}
        ${randomMinMax(1000, 9000)}
        ${randomMinMax(1000, 9000)}
        ${randomMinMax(1000, 9000)}
        ${randomMinMax(10, 90)}`
}

function populateReceipt() {
    const itemsOnReceipt = document.getElementById('receipt-items')
    const evolutionOnReceipt = document.getElementById('receipt-evolution')
    console.log(selectedItems)

    if (selectedItems.length > 0) {
        const sortedSelectedItems = selectedItems.sort()
        let totalEarliestPrice = 0
        let totalLatestPrice = 0
        let totalMigrosEarliestPrice = 0
        let totalMigrosLatestPrice = 0
        let totalCoopEarliestPrice = 0
        let totalCoopLatestPrice = 0
        let itemsCoopNbr = 0
        let itemsMigrosNbr = 0
        let itemsCoopHTML = ''
        let itemsCoopHeadHTML = ''
        let itemsMigrosHTML = ''
        let itemsMigrosHeadHTML = ''

        let itemsHTML = `
            <table id="receipt-table-items">
                <tr class="receipt-item-header">
                    <th class="receipt-item-name"></th>
                    <th class="receipt-item-price">Prix<br>17.05.22</th>
                    <th class="receipt-item-price">Prix<br>01.10.22</th>
                </tr>`

        for (let i = 0; i < sortedSelectedItems.length; i++) {
            const item = selectedItems[i]
            const itemData = dataInflation.find(({ product_id }) => product_id === item);
            const itemShop = itemData['shop']
            const itemPrices = getItemPrices(itemData)
            const itemEarliestPrice = parseFloat(getItemEarliestPrice(itemPrices))
            const itemLatestPrice = parseFloat(getItemLatestPrice(itemPrices))

            totalEarliestPrice += itemEarliestPrice
            totalLatestPrice += itemLatestPrice
            console.log(itemShop)

            if (itemShop === 'Coop') {
                console.log(itemsCoopNbr)
                itemsCoopHTML += `
                    <tr>
                        <td class="receipt-item-name">${itemData.product_short}</td>
                        <td class="receipt-item-price">${itemEarliestPrice.toFixed(2)}</td>
                        <td class="receipt-item-price">${itemLatestPrice.toFixed(2)}</td>
                    </tr>`

                totalCoopEarliestPrice += itemEarliestPrice
                totalCoopLatestPrice += itemLatestPrice
                itemsCoopNbr += 1
            } else if (itemShop === 'Migros') {
                console.log(itemsMigrosNbr)

                itemsMigrosHTML += `
                    <tr>
                        <td class="receipt-item-name">${itemData.product_short}</td>
                        <td class="receipt-item-price">${itemEarliestPrice.toFixed(2)}</td>
                        <td class="receipt-item-price">${itemLatestPrice.toFixed(2)}</td>
                    </tr>`

                totalMigrosEarliestPrice += itemEarliestPrice
                totalMigrosLatestPrice += itemLatestPrice
                itemsMigrosNbr += 1
            }
        }

        if (itemsCoopNbr > 0 && itemsMigrosNbr > 0) {
            itemsCoopHeadHTML +=  `
                <tr>
                    <td class="receipt-item-name">-- COOP --</td>
                </tr>`
            itemsMigrosHeadHTML +=  `
                        <tr>
                            <td class="receipt-item-shop">-- MIGROS --</td>
                        </tr>`
        }

        itemsHTML += itemsCoopHeadHTML
        itemsHTML += itemsCoopHTML
        itemsHTML += itemsMigrosHeadHTML
        itemsHTML += itemsMigrosHTML

        // total row
        itemsHTML += `
            <tr class="receipt-total-row">
                <td>TOTAL</td>
                <td>${totalEarliestPrice.toFixed(2)}</td>
                <td>${totalLatestPrice.toFixed(2)}</td>
            </tr>
            </table>`

        itemsOnReceipt.innerHTML = itemsHTML

        // evolution section
        const priceDiff = (totalLatestPrice - totalEarliestPrice).toFixed(2)
        const percentDiff = Math.round(totalLatestPrice / totalEarliestPrice * 100 - 100)
        const priceDiffCoop = (totalCoopLatestPrice - totalCoopEarliestPrice).toFixed(2)
        const percentDiffCoop = Math.round(totalCoopLatestPrice / totalCoopEarliestPrice * 100 - 100)
        const priceDiffMigros = (totalMigrosLatestPrice - totalMigrosEarliestPrice).toFixed(2)
        const percentDiffMigros = Math.round(totalMigrosLatestPrice / totalMigrosEarliestPrice * 100 - 100)

        let evolutionHTML = `
            <div>- - - - - - - - - - - - - - - - - - -</div>
            <table id="receipt-table-evolution">
                <tr>
                    <td class="receipt-evolution-name">- Evolution du prix -</td>
                </tr>`

        if (itemsCoopNbr > 0 && itemsMigrosNbr > 0) {
            evolutionHTML += `
                <tr>
                    <td class="receipt-evolution-name">Différence Coop</td>
                    <td class="receipt-evolution-price">${priceDiffCoop} CHF</td>
                    <td class="receipt-evolution-price">${percentDiffCoop} %</td>
                </tr>
                <tr>
                    <td class="receipt-evolution-name">Différence Migros</td>
                    <td class="receipt-evolution-price">${priceDiffMigros} CHF</td>
                    <td class="receipt-evolution-price">${percentDiffMigros} %</td>
                </tr>`
        }

        evolutionHTML += `
                <tr class="receipt-total-row">
                    <td>TOTAL</td>
                    <td>${priceDiff} CHF</td>
                    <td>${percentDiff} %</td>
                </tr>`

        evolutionOnReceipt.innerHTML = evolutionHTML + '</table>'
    } else {
        itemsOnReceipt.innerHTML = 'Aucun produit sélectionné'
        evolutionOnReceipt.innerHTML = ''
    }
}

setup()