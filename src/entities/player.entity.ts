// STEP 2: Player entity -> "player" table
// Columns: id, name (20), gold, xp, kills (default 0), monsterHp (nullable int)
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('player')
export class Player {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ length: 20 })
  name!: string;

  @Column('int')
  gold!: number;

  @Column('int')
  xp!: number;

  @Column('int', { default: 0 })
  kills!: number;

  @Column('int', { nullable: true })
  monsterHp!: number | null;
}