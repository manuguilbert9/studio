

// THIS FILE IS NO LONGER USED AND CAN BE DELETED
// Text data is now fetched from /public/fluence directory via an API route.

export interface ReadingText {
    level: 'Niveau A' | 'Niveau B' | 'Niveau C' | 'Niveau D';
    title: string;
    text: string;
}

export const readingTexts: ReadingText[] = [
    // Niveau A
    {
        level: 'Niveau A',
        title: 'Léo et le sac',
        text: "Léo a un sac. Léo a un rat. Le rat va au sac."
    },
    {
        level: 'Niveau A',
        title: 'Le vélo de papa',
        text: "Papa a un vélo. Léo va à vélo. Maman a un gâteau."
    },
    {
        level: 'Niveau A',
        title: 'La robe de Lila',
        text: "Lila a une robe. Lila va à la mare. La robe est à Lila."
    },
    {
        level: 'Niveau A',
        title: 'Le ballon de Tom',
        text: "Tom a un ballon. Le ballon est rouge. Tom tape le ballon."
    },
    {
        level: 'Niveau A',
        title: 'Sami et son chat',
        text: "Sami a un chat. Le chat va sur le lit. Sami dit : “Chat, va au sac !”"
    },
    // Niveau B
    {
        level: 'Niveau B',
        title: 'La poupée de Léa',
        text: "Léa a une poupée. La poupée est dans le lit. Léa chante pour sa poupée."
    },
    {
        level: 'Niveau B',
        title: 'Hugo et son chien',
        text: "Hugo joue avec son chien. Le chien court dans le jardin. Hugo rit et lance un bâton."
    },
    {
        level: 'Niveau B',
        title: 'Paul va à l’école',
        text: "Le matin, Paul met son cartable. Il part à l’école avec sa maman. Paul dit bonjour à la maîtresse."
    },
    {
        level: 'Niveau B',
        title: 'Mila au parc',
        text: "Il fait beau ce dimanche. Mila va au parc avec son papa. Elle glisse sur le toboggan et rit fort."
    },
    {
        level: 'Niveau B',
        title: 'La cabane secrète',
        text: "Dans la forêt, une cabane est cachée. Lucas et Nina y vont souvent. Ils jouent à faire comme s’ils étaient perdus."
    },
    // Niveau C
    {
        level: 'Niveau C',
        title: 'Les feuilles d\'automne',
        text: "Le vent souffle dans les arbres. Les feuilles tombent une à une et couvrent le sol. Julie en ramasse une très grande, toute rouge et brillante. Elle la montre à son frère qui sourit. Ensemble, ils remplissent un panier de feuilles de toutes les couleurs. Le chemin devient glissant, mais ils avancent en riant. À la maison, ils collent les feuilles dans un cahier pour garder un souvenir de l’automne."
    },
    {
        level: 'Niveau C',
        title: 'Martin et les poules',
        text: "Chaque matin, Martin nourrit les poules du poulailler. Il leur donne du grain et regarde les petites bêtes picorer. Ensuite, il ramasse les œufs encore tièdes dans un panier. Parfois, une poule glousse si fort qu’il en sursaute. Martin aime ce moment tranquille avant d’aller à l’école. Quand il rentre à la maison, il pose les œufs sur la table. Sa maman les utilise pour préparer une omelette bien dorée."
    },
    {
        level: 'Niveau C',
        title: 'Jeux de plage',
        text: "Au bord de la mer, des enfants jouent ensemble. Ils creusent un grand trou dans le sable avec leurs seaux et leurs pelles. Le trou devient si profond qu’ils ne voient presque plus le fond. Soudain, une vague s’avance et envahit le trou. Les enfants éclatent de rire en voyant l’eau remplir leur construction. Le soleil brille, le vent souffle doucement, et tout le monde profite de cette belle journée d’été."
    },
    {
        level: 'Niveau C',
        title: 'La boîte à trésors',
        text: "Dans le grenier, Emma découvre une vieille boîte en bois. Elle souffle dessus et enlève la poussière. Avec précaution, elle l’ouvre et découvre de vieilles photos jaunies. On y voit ses grands-parents quand ils étaient jeunes. Intriguée, Emma observe chaque image et imagine leur vie autrefois. Le grenier sent le bois sec et le vieux linge. Emma descend en courant pour montrer son trésor à sa maman, très émue."
    },
    {
        level: 'Niveau C',
        title: 'Soir de village',
        text: "Le soir tombe doucement sur le village. Le ciel devient orange, puis rose et enfin violet. Les habitants allument les lampes dans leurs maisons. On entend les cloches de l’église qui annoncent l’heure. Dans la rue, quelques chats se promènent à pas feutrés. Tout devient calme et tranquille. Dans une petite maison, Paul fait ses devoirs près de la fenêtre. Il écrit lentement ses leçons pendant que sa sœur lit un livre."
    },
    // Niveau D
    {
        level: 'Niveau D',
        title: 'Soir d\'automne',
        text: "À l’automne, les journées raccourcissent. Le soleil se cache tôt derrière la colline et l’air devient plus frais. Clara et son frère allument une lampe pour continuer à lire leurs livres préférés. Le vent fait claquer les volets, mais la maison reste chaleureuse. Leur maman prépare une tisane parfumée, et l’odeur emplit la cuisine. Clara tourne les pages avec attention et se laisse emporter par l’histoire. La lecture devient un voyage imaginaire qui fait oublier la nuit tombante."
    },
    {
        level: 'Niveau D',
        title: 'La châtaigne',
        text: "Clara traverse la cour de l’école, les mains dans ses poches. Les feuilles mortes craquent sous ses pas et volent au moindre souffle de vent. Elle sourit en pensant aux vacances qui approchent. Autour d’elle, les enfants discutent, courent, jouent à la marelle. Clara s’arrête près du grand marronnier et ramasse une bogue ouverte. À l’intérieur, une châtaigne brille comme un petit trésor. Elle décide de la garder en souvenir de cette belle journée d’automne."
    },
    {
        level: 'Niveau D',
        title: 'Silence à la bibliothèque',
        text: "Dans la bibliothèque, le silence est presque complet. Les élèves sont assis à leur table, plongés dans leurs livres. Seul le froissement des pages se fait entendre. Paul lit un roman d’aventures et s’imagine en explorateur traversant des forêts immenses. À côté de lui, Zoé prend des notes pour un exposé. L’odeur des livres anciens emplit la pièce. Chacun travaille avec sérieux, et le temps semble s’arrêter. La cloche de fin de cours surprend tout le monde."
    },
    {
        level: 'Niveau D',
        title: 'Voyage en train',
        text: "Le train file à toute vitesse à travers la campagne. Par la vitre, on aperçoit des champs immenses, des bois sombres et des villages endormis. Paul colle son front contre la vitre froide. Il pense à son arrivée à Paris et aux monuments qu’il va découvrir. Sa maman lit un magazine, tandis que son petit frère s’endort sur la banquette. Le voyage est long, mais l’excitation de l’aventure rend l’attente plus facile et joyeuse."
    },
    {
        level: 'Niveau D',
        title: 'Nuit de tempête',
        text: "La tempête éclate au milieu de la nuit. Le vent souffle si fort qu’il secoue les volets et fait grincer les portes. La pluie martèle les vitres et le tonnerre gronde dans le ciel. Pourtant, Camille n’a pas peur. Bien au chaud sous sa couverture, elle écoute le vacarme comme une musique étrange. Elle ferme les yeux et s’endort doucement, bercée par le bruit du vent. Le lendemain matin, le jardin est jonché de branches et de flaques d’eau."
    }
];
