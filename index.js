let dataInflation;

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

function getItemData(item) {
    for (const i in dataInflation) {
        const itemObject = dataInflation[i]
        if (itemObject.id === item) {
            console.log(itemObject)
            return itemObject
        } else {
            console.log('no item found')
        }
    }
}

function clickedItem(item) {
    document.getElementById('overlay').style.display = 'block'
    document.getElementById('detailsContainer').style.display = 'block'
    console.log('clicked', item)
    getItemData(item)

    const itemIconLoc = document.getElementById('itemIcon')
    itemIconLoc.innerHTML = `<img src="images/${item}.png" alt="">`

    const detailsTableLoc = document.getElementById('detailsTable')
    let detailsTableHTML = '<table>'
    detailsTableHTML += '</table>'

    const priceBoxLoc = document.getElementById('priceBox')
    let priceHTML = ''
    const priceBefore = parseFloat(dataDetails[item]['priceBefore']).toFixed(2)
    const priceNow = parseFloat(dataDetails[item]['priceNow']).toFixed(2)
    const priceDiff = (priceNow - priceBefore).toFixed(2)
    const percentDiff = Math.round(priceNow / priceBefore * 100 - 100)
    console.log(priceBefore, priceNow, priceDiff, percentDiff)

}

function closeDetailsWindow() {
    document.getElementById('overlay').style.display = 'none'
    document.getElementById('detailsContainer').style.display = 'none'
}

const testData = {
    '17.05': '1.7',
    '01.06': '1.7',
    '15.06': '2.2',
    '01.07': '2.1',
    '15.07': null,
    '31.07': '2.1',
    '16.08': '2.1',
    '15.09': '2.4',
}

const dataChart = {
    datasets: [{
        label: 'Prix',
        backgroundColor: '#dc2733',
        borderColor: '#dc2733',
        data: testData,
        spanGaps: true,
}]
};

const config = {
    type: 'line',
    data: dataChart,
    options: {
        scales: {
            yAxis: {min: 0, max: 5}
        },
        plugins: {
            legend: {
                display:false
            }
        }
    }
};

const myChart = new Chart(
    document.getElementById('priceChart'),
    config
);

setup()