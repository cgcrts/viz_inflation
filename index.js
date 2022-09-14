const dataDetails = {
    pain: {
        product: 'Pain paysan',
        shop: 'Migros',
        quantity: '500g',
        priceBefore: '3.00 CHF',
        priceNow: '3.30 CHF',
        priceEvolution: '0.30 CHF',
        percentageEvolution: '+10 %',
    }
}

const labelDetails = {
    product: 'Produit',
    shop: 'Magasin',
    quantity: 'Quantité',
    priceBefore: 'Prix initial',
    priceNow: 'Prix actuel',
    priceEvolution: 'Evolution du prix',
    percentageEvolution: 'Evolution en %',
}

function clickedItem(item) {
    document.getElementById('cover').style.display = 'block'
    document.getElementById('detailsPanel').style.display = 'block'
    console.log('clicked', item)

    const detailsListSpot = document.getElementById('detailsList')
    let listHTML = '<ul>'

    const itemDetails = dataDetails[item]
    for (const itemDetailsKey in itemDetails) {
        const itemDetailsValue = itemDetails[itemDetailsKey]
        const itemLabel = labelDetails[itemDetailsKey]
        listHTML = listHTML + `<li>${itemLabel}: ${itemDetailsValue}</li>`
    }
    listHTML += '</ul>'
    detailsListSpot.innerHTML = listHTML
}

function closeButton() {
    document.getElementById('cover').style.display = 'none'
    document.getElementById('detailsPanel').style.display = 'none'
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