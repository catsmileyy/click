// STEP 4: InventoryItem entity -> link table Player <-> Item
// Columns: id, playerId, itemId, quantity (default 1)
// Add a ManyToOne relation to Item and a unique constraint on playerId + itemId.
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, Unique, JoinColumn } from 'typeorm';
import { Player } from './player.entity';
import { Item } from './item.entity';

@Entity()
@Unique(['playerId', 'itemId'])
export class InventoryItem {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column('int')
  playerId!: number;

  @Column('int')
  itemId!: number;

  @Column('int', { default: 1 })
  quantity!: number;

  @ManyToOne(() => Item)
  @JoinColumn({ name: 'itemId' })
  item!: Item;
}