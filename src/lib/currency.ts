

export const currency = [
    { name: '1c', value: 0.01, image: '/images/monnaie/1cent.png', type: 'pièce' },
    { name: '2c', value: 0.02, image: '/images/monnaie/2cents.png', type: 'pièce' },
    { name: '5c', value: 0.05, image: '/images/monnaie/5cents.png', type: 'pièce' },
    { name: '10c', value: 0.10, image: '/images/monnaie/10cents.png', type: 'pièce' },
    { name: '20c', value: 0.20, image: '/images/monnaie/20cents.png', type: 'pièce' },
    { name: '50c', value: 0.50, image: '/images/monnaie/50cents.png', type: 'pièce' },
    { name: '1€', value: 1.00, image: '/images/monnaie/1euro.png', type: 'pièce' },
    { name: '2€', value: 2.00, image: '/images/monnaie/2euros.png', type: 'pièce' },
    { name: '5€', value: 5.00, image: '/images/monnaie/5euros.png', type: 'billet' },
    { name: '10€', value: 10.00, image: '/images/monnaie/10euros.png', type: 'billet' },
    { name: '20€', value: 20.00, image: '/images/monnaie/20euros.png', type: 'billet' },
    { name: '50€', value: 50.00, image: '/images/monnaie/50euros.png', type: 'billet' },
];

export const euroPiecesAndBillets = currency.filter(c => c.value >= 1); // Only euros
export const allCoins = currency.filter(c => c.type.startsWith('pièce'));

export function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: 'EUR',
    }).format(amount);
}
