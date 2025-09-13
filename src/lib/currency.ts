
export const currency = [
    { name: '1c', value: 0.01, image: '/images/monnaie/1cent.png' },
    { name: '2c', value: 0.02, image: '/images/monnaie/2cents.png' },
    { name: '5c', value: 0.05, image: '/images/monnaie/5cents.png' },
    { name: '10c', value: 0.10, image: '/images/monnaie/10cents.png' },
    { name: '20c', value: 0.20, image: '/images/monnaie/20cents.png' },
    { name: '50c', value: 0.50, image: '/images/monnaie/50cents.png' },
    { name: '1€', value: 1.00, image: '/images/monnaie/1euro.png' },
    { name: '2€', value: 2.00, image: '/images/monnaie/2euros.png' },
    { name: '5€', value: 5.00, image: '/images/monnaie/5euros.png' },
    { name: '10€', value: 10.00, image: '/images/monnaie/10euros.png' },
    { name: '20€', value: 20.00, image: '/images/monnaie/20euros.png' },
    { name: '50€', value: 50.00, image: '/images/monnaie/50euros.png' },
];

export function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: 'EUR',
    }).format(amount);
}
