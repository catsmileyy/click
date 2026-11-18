// STEP 1: Item entity -> "item" table
// Columns: id, name, icon, attack (int), price (int)
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('item')
export class Item {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  name!: string;

  @Column()
  icon!: string;

  @Column('int')
  attack!: number;

  @Column('int')
  price!: number;
}
