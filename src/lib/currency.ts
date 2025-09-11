
export const currency = [
    { name: '1c', value: 0.01, image: '/images/currency/1c.png' },
    { name: '2c', value: 0.02, image: '/images/currency/2c.png' },
    { name: '5c', value: 0.05, image: '/images/currency/5c.png' },
    { name: '10c', value: 0.10, image: '/images/currency/10c.png' },
    { name: '20c', value: 0.20, image: '/images/currency/20c.png' },
    { name: '50c', value: 0.50, image: '/images/currency/50c.png' },
    { name: '1€', value: 1.00, image: '/images/currency/1e.png' },
    { name: '2€', value: 2.00, image: '/images/currency/2e.png' },
    { name: '5€', value: 5.00, image: '/images/currency/5e.png' },
    { name: '10€', value: 10.00, image: '/images/currency/10e.png' },
    { name: '20€', value: 20.00, image: '/images/currency/20e.png' },
    { name: '50€', value: 50.00, image: '/images/currency/50e.png' },
];

export function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: 'EUR',
    }).format(amount);
}
