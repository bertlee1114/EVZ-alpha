class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.canvas.width = 800;
        this.canvas.height = 600;
        
        this.grid = {
            rows: 5, // Multiple lanes now
            cols: 9,
            cellSize: 80
        };

        this.sun = 50;
        this.totalSun = 50; // For shop purchases
        this.plants = [];
        this.zombies = [];
        this.projectiles = [];
        this.selectedPlant = null;
        
        // Plant costs
        this.plantCosts = {
            'sunflower': 1,
            'peashooter': 2,
            'acorn_smartan': 1,
            'super_peashooter': 2
        };
        
        // Unlocked plants
        this.unlockedPlants = {
            'sunflower': true,
            'peashooter': true,
            'acorn_smartan': true,
            'super_peashooter': false
        };
        
        // Current screen
        this.currentScreen = 'home';
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.showScreen('home');
    }
    
    startGame() {
        this.showScreen('game');
        this.gameLoop();
        this.spawnZombiesInterval();
    }
    
    showScreen(screenName) {
        // Hide all screens
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        
        // Show the requested screen
        if (screenName === 'home') {
            document.getElementById('home-screen').classList.add('active');
            this.currentScreen = 'home';
        } else if (screenName === 'shop') {
            document.getElementById('shop-screen').classList.add('active');
            this.currentScreen = 'shop';
            // Update shop display
            document.querySelectorAll('.shop-item').forEach(item => {
                const plantType = item.getAttribute('data-plant');
                const buyBtn = item.querySelector('.buy-btn');
                if (this.unlockedPlants[plantType]) {
                    buyBtn.textContent = 'Purchased';
                    buyBtn.disabled = true;
                } else {
                    buyBtn.textContent = 'Buy';
                    buyBtn.disabled = false;
                }
            });
        } else if (screenName === 'game') {
            document.getElementById('game-container').classList.add('active');
            this.currentScreen = 'game';
        }
    }

    setupEventListeners() {
        // Home screen buttons
        document.getElementById('start-game-btn').addEventListener('click', () => {
            this.startGame();
        });

        document.getElementById('shop-btn').addEventListener('click', () => {
            this.showScreen('shop');
        });

        // Shop screen buttons
        document.getElementById('back-to-home-btn').addEventListener('click', () => {
            this.showScreen('home');
        });

        document.querySelectorAll('.buy-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const plantType = btn.parentElement.getAttribute('data-plant');
                const cost = parseInt(btn.parentElement.getAttribute('data-cost'));
                
                console.log(`Attempting to purchase ${plantType} for ${cost} sun. Current sun: ${this.totalSun}`);
                
                if (this.totalSun >= cost) {
                    this.totalSun -= cost;
                    this.unlockedPlants[plantType] = true;
                    
                    // Update shop display
                    btn.textContent = 'Purchased';
                    btn.disabled = true;
                    
                    // Update plant selector
                    const plantCard = document.querySelector(`.plant-card[data-plant="${plantType}"]`);
                    if (plantCard) {
                        plantCard.classList.remove('locked');
                        const lockedOverlay = plantCard.querySelector('.locked-overlay');
                        if (lockedOverlay) {
                            lockedOverlay.remove();
                        }
                    }
                    
                    console.log(`Purchased ${plantType} for ${cost} sun`);
                }
            });
        });


        // Game screen buttons
        document.getElementById('back-to-menu-btn').addEventListener('click', () => {
            this.showScreen('home');
        });

        // Plant selection
        const plantCards = document.querySelectorAll('.plant-card');
        plantCards.forEach(card => {
            card.addEventListener('click', () => {
                const plantType = card.getAttribute('data-plant');
                if (!card.classList.contains('locked') && this.unlockedPlants[plantType]) {
                    this.selectedPlant = plantType;
                    
                    // Visual feedback for selection
                    plantCards.forEach(c => c.classList.remove('selected'));
                    card.classList.add('selected');
                    
                    console.log(`Selected plant: ${plantType}`);
                }
            });
        });

        // Plant placement
        this.canvas.addEventListener('click', (e) => {
            if (!this.selectedPlant) {
                console.log('No plant selected');
                return;
            }
            
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            // Convert click coordinates to grid position
            const gridX = Math.floor(x / this.grid.cellSize);
            const gridY = Math.floor(y / this.grid.cellSize);
            
            console.log(`Canvas clicked at (${x}, ${y}), grid position: (${gridX}, ${gridY})`);
            
            // Check if gridY is within bounds
            if (gridY >= 0 && gridY < this.grid.rows) {
                this.placePlant(gridX, gridY);
            } else {
                console.log(`Grid position (${gridX}, ${gridY}) is out of bounds`);
            }
        });
        
        // Log when game starts
        console.log('Game initialized, event listeners set up');
    }

    placePlant(gridX, gridY) {
        // Check if the cell is empty
        const cellOccupied = this.plants.some(plant => 
            plant.gridX === gridX && plant.gridY === gridY
        );
        
        if (cellOccupied) {
            console.log(`Cell at (${gridX}, ${gridY}) is already occupied`);
            return;
        }
        
        // Check if we have enough sun
        const sunCost = this.plantCosts[this.selectedPlant];
        console.log(`Attempting to place ${this.selectedPlant} at (${gridX}, ${gridY}). Cost: ${sunCost}, Available sun: ${this.sun}`);
        
        if (this.sun >= sunCost) {
            const plant = {
                gridX: gridX,
                gridY: gridY,
                x: gridX * this.grid.cellSize,
                y: gridY * this.grid.cellSize,
                type: this.selectedPlant,
                health: 100,
                lastShot: 0,
                state: 'normal', // For Acorn Smartan states
                lastAbility: 0,   // For special abilities like shield bash
                attackSpeed: 1     // Multiplier for attack speed
            };
            
            this.plants.push(plant);
            this.sun -= sunCost;
            
            // Create DOM element for the plant
            const plantElement = document.createElement('div');
            plantElement.className = `plant ${plant.type}`;
            plantElement.style.left = `${plant.x}px`;
            plantElement.style.top = `${plant.y}px`;
            document.getElementById('plants-container').appendChild(plantElement);
            
            console.log(`Successfully placed ${plant.type} at (${gridX}, ${gridY})`);
        } else {
            console.log(`Not enough sun to place ${this.selectedPlant}. Need ${sunCost}, have ${this.sun}`);
        }
    }

    spawnZombiesInterval() {
        setInterval(() => {
            // Randomly select a lane to spawn zombie
            const randomLane = Math.floor(Math.random() * this.grid.rows);
            this.zombies.push({
                x: this.canvas.width,
                y: randomLane * this.grid.cellSize,
                gridY: randomLane,
                health: 100,
                speed: 1,
                knockback: 0 // For Acorn Smartan's shield bash
            });
        }, 10000);
    }

    update() {
        // Update zombies
        this.zombies.forEach(zombie => {
            // Apply knockback if any
            if (zombie.knockback > 0) {
                zombie.x += 2; // Move backward
                zombie.knockback--;
            } else {
                zombie.x -= zombie.speed;
            }
        });

        // Update plants and shooting
        this.plants.forEach(plant => {
            // peashooter logic
            if (plant.type === 'peashooter' && Date.now() - plant.lastShot > 2000) {
                this.projectiles.push({
                    x: plant.x + this.grid.cellSize,
                    y: plant.y + this.grid.cellSize / 2,
                    speed: 5,
                    damage: 20
                });
                plant.lastShot = Date.now();
            }
            
            // Super peashooter logic (faster and stronger)
            if (plant.type === 'super_peashooter' && Date.now() - plant.lastShot > 1000) {
                this.projectiles.push({
                    x: plant.x + this.grid.cellSize,
                    y: plant.y + this.grid.cellSize / 2,
                    speed: 7,
                    damage: 40
                });
                plant.lastShot = Date.now();
            }
            
            // Sunflower logic
            if (plant.type === 'sunflower' && Date.now() - plant.lastShot > 10000) {
                this.sun += 25;
                plant.lastShot = Date.now();
            }
            
            // Acorn Smartan logic
            if (plant.type === 'acorn_smartan') {
                // Check health for state change
                if (plant.health <= 20 && plant.state === 'normal') {
                    plant.state = 'red';
                    plant.attackSpeed = 2; // 200% faster attacks
                    
                    // Update the visual
                    const plantElement = document.querySelector(`.plant[style*="left: ${plant.x}px"][style*="top: ${plant.y}px"]`);
                    if (plantElement) {
                        plantElement.className = 'plant acorn_smartan_red';
                    }
                }
                
                // Attack with sr
                const attackInterval = 3000 / plant.attackSpeed; // Adust for attack speed
                if (Date.now() - plant.lastShot > attackInterval) {
                    // Find zombies in the same lane
                    const zombiesInLane = this.zombies.filter(zombie => 
                        zombie.gridY === plant.gridY && zombie.x > plant.x
                    );
                    
                    if (zombiesInLane.length > 0) {
                        // Sort by closest
                        zombiesInLane.sort((a, b) => a.x - b.x);
                        const target = zombiesInLane[0];
                        
                        // Create a sr projectile
                        this.projectiles.push({
                            x: plant.x + this.grid.cellSize,
                            y: plant.y + this.grid.cellSize / 2,
                            speed: 6,
                            damage: 25
                        });
                        plant.lastShot = Date.now();
                    }
                }
                
                // Shield bash ability (for the shield state)
                if (plant.state === 'shield' && Date.now() - plant.lastAbility > 5000) {
                    // Find zombies in close range
                    const closeZombies = this.zombies.filter(zombie => 
                        zombie.gridY === plant.gridY && 
                        zombie.x > plant.x && 
                        zombie.x < plant.x + this.grid.cellSize * 2
                    );
                    
                    if (closeZombies.length > 0) {
                        // Apply knockback to all close zombies
                        closeZombies.forEach(zombie => {
                            zombie.knockback = 30; // Knockback frames
                            zombie.health -= 15; // Damage from bash
                        });
                        
                        plant.lastAbility = Date.now();
                    }
                }
            }
        });

        // Update projectiles
        this.projectiles.forEach(projectile => {
            projectile.x += projectile.speed;
        });

        // Check collisions
        this.checkCollisions();
        
        // Remove zombies that have been defeated
        this.zombies = this.zombies.filter(zombie => zombie.health > 0);
        
        // Remove projectiles that are off-screen
        this.projectiles = this.projectiles.filter(projectile => 
            projectile.x < this.canvas.width
        );
    }

    checkCollisions() {
        // Projectile-zombie collisions
        this.projectiles.forEach((projectile, pIndex) => {
            this.zombies.forEach((zombie, zIndex) => {
                if (this.checkCollision(projectile, zombie)) {
                    // Use the projectile's damage value or default to 20
                    zombie.health -= projectile.damage || 20;
                    this.projectiles.splice(pIndex, 1);
                    
                    if (zombie.health <= 0) {
                        this.zombies.splice(zIndex, 1);
                        // Add sun when defeating zombies
                        this.sun += 1;
                        this.totalSun += 1;
                    }
                }
            });
        });
        
        // Plant-zombie collisions (for damage to plants)
        this.plants.forEach((plant, pIndex) => {
            this.zombies.forEach(zombie => {
                if (plant.gridX * this.grid.cellSize < zombie.x + this.grid.cellSize &&
                    (plant.gridX + 1) * this.grid.cellSize > zombie.x &&
                    plant.gridY === zombie.gridY) {
                    
                    // Damage the plant
                    plant.health -= 0.1; // Slow damage over time
                    
                    // Check if plant should be removed
                    if (plant.health <= 0) {
                        // Remove the plant element
                        const plantElement = document.querySelector(`.plant[style*="left: ${plant.x}px"][style*="top: ${plant.y}px"]`);
                        if (plantElement) {
                            plantElement.remove();
                        }
                        
                        // Remove from plants array
                        this.plants.splice(pIndex, 1);
                    } 
                    // Check if Acorn Smartan should change to shield state
                    else if (plant.type === 'acorn_smartan' && plant.health <= 50 && plant.state === 'normal') {
                        plant.state = 'shield';
                        
                        // Update the visual
                        const plantElement = document.querySelector(`.plant[style*="left: ${plant.x}px"][style*="top: ${plant.y}px"]`);
                        if (plantElement) {
                            plantElement.className = 'plant acorn_smartan_shield';
                        }
                    }
                }
            });
        });
    }
    
    checkCollision(ob1, ob2) {
        return ob1.x < ob2.x + this.grid.cellSize &&
               ob1.x + 10 > ob2.x &&
               ob1.y < ob2.y + this.grid.cellSize &&
               ob1.y + 10 > ob2.y;
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw grid - multiple rows for lanes
        for (let row = 0; row < this.grid.rows; row++) {
            for (let col = 0; col < this.grid.cols; col++) {
                this.ctx.strokeRect(
                    col * this.grid.cellSize,
                    row * this.grid.cellSize,
                    this.grid.cellSize,
                    this.grid.cellSize
                );
            }
        }

        // Plants are now handled by DOM elements
        // We don't need to draw them on canvas
        
        // Draw zombies with numeric health
        this.zombies.forEach(zombie => {
            // Draw zombie base
            this.ctx.fillStyle = '#666';
            this.ctx.fillRect(zombie.x, zombie.y, this.grid.cellSize * 0.8, this.grid.cellSize);
            
            // Draw health number
            this.ctx.fillStyle = zombie.health > 30 ? '#00ff00' : '#ff0000';
            this.ctx.font = '16px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(
                Math.ceil(zombie.health), 
                zombie.x + (this.grid.cellSize * 0.4), 
                zombie.y - 5
            );
        });

        // Draw projectiles
        this.projectiles.forEach(projectile => {
            // Different colors for different projectiles
            if (projectile.damage >= 40) {
                this.ctx.fillStyle = '#9C27B0'; // Purple for super shooter
            } else if (projectile.damage >= 25) {
                this.ctx.fillStyle = '#8D6E63'; // Brown for acorn smartan
            } else {
                this.ctx.fillStyle = 'black'; // Default
            }
            
            this.ctx.fillRect(
                projectile.x,
                projectile.y,
                10,
                10
            );
        });

        // Update sun counter
        document.getElementById('sun-amount').textContent = this.sun;
    }

    gameLoop() {
        this.update();
        this.draw();
        requestAnimationFrame(() => this.gameLoop());
    }
}

// Start the game when the page loads
window.onload = () => {
    new Game();
};