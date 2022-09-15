const dataDetails = {
    pain: {
        img: 'bread.png',
        product: 'Pain paysan',
        shop: 'Migros',
        brand: 'Boulangerie Migros',
        quantity: '500g',
        link: 'https://www.migros.ch',
        priceBefore: '3',
        priceNow: '3.30',
    }
}

const labelDetails = {
    product: 'Produit',
    shop: 'Magasin',
    brand: 'Marque',
    quantity: 'Quantité',
    link: 'Lien',
    priceBefore: 'Prix initial',
    priceNow: 'Prix actuel',
    priceEvolution: 'Evolution du prix',
    percentageEvolution: 'Evolution en %',
}

const priceLabels = [
    'priceBefore', 'priceNow', 'priceEvolution', 'percentageEvolution',
]

function clickedItem(item) {
    document.getElementById('overlay').style.display = 'block'
    document.getElementById('detailsContainer').style.display = 'block'
    console.log('clicked', item)

    const detailsTableLoc = document.getElementById('detailsList')
    let detailsHTML = '<table>'
    detailsHTML += '</table>'
    //detailsTableLoc.innerHTML = detailsHTML

    const priceBoxLoc = document.getElementById('priceBox')
    let priceHTML = ''
    const priceBefore = parseFloat(dataDetails[item]['priceBefore']).toFixed(2)
    const priceNow = parseFloat(dataDetails[item]['priceNow']).toFixed(2)
    const priceDiff = (priceNow - priceBefore).toFixed(2)
    const percentDiff = Math.round(priceNow / priceBefore * 100 - 100)
    console.log(priceBefore, priceNow, priceDiff, percentDiff)

}

function closeButton() {
    document.getElementById('overlay').style.display = 'none'
    document.getElementById('detailsContainer').style.display = 'none'
}

const labelsChart = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    ];

const dataChart = {
    labels: labelsChart,
    datasets: [{
        label: 'My First dataset',
        backgroundColor: 'rgb(255, 99, 132)',
        borderColor: 'rgb(255, 99, 132)',
        data: [0, 10, 5, 2, 20, 30, 45],
}]
};

const config = {
    type: 'line',
    data: dataChart,
    options: {}
};

const myChart = new Chart(
    document.getElementById('priceChart'),
    config
);