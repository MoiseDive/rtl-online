import { type User, type InsertUser, type StreamConfig, type InsertStreamConfig, type Program, type InsertProgram, type Emission, type InsertEmission, type ContactInfo, type InsertContactInfo, users, streamConfig, programs, emissions, contactInfo } from "@shared/schema";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});

export const db = drizzle(pool);

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getStreamConfig(): Promise<StreamConfig | undefined>;
  updateStreamConfig(config: InsertStreamConfig): Promise<StreamConfig>;
  getPrograms(): Promise<Program[]>;
  createProgram(program: InsertProgram): Promise<Program>;
  deleteProgram(id: string): Promise<void>;
  getEmissions(): Promise<Emission[]>;
  createEmission(emission: InsertEmission): Promise<Emission>;
  deleteEmission(id: string): Promise<void>;
  getContactInfo(): Promise<ContactInfo | undefined>;
  updateContactInfo(info: InsertContactInfo): Promise<ContactInfo>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async getStreamConfig(): Promise<StreamConfig | undefined> {
    const [config] = await db.select().from(streamConfig).limit(1);
    return config;
  }

  async updateStreamConfig(config: InsertStreamConfig): Promise<StreamConfig> {
    const existing = await this.getStreamConfig();
    if (existing) {
      const [updated] = await db.update(streamConfig).set({ ...config, updatedAt: new Date() }).where(eq(streamConfig.id, existing.id)).returning();
      return updated;
    }
    const [created] = await db.insert(streamConfig).values(config).returning();
    return created;
  }

  async getPrograms(): Promise<Program[]> {
    return db.select().from(programs);
  }

  async createProgram(program: InsertProgram): Promise<Program> {
    const [created] = await db.insert(programs).values(program).returning();
    return created;
  }

  async updateProgram(id: string, program: Partial<InsertProgram>): Promise<Program> {
    const [updated] = await db.update(programs).set(program).where(eq(programs.id, id)).returning();
    return updated;
  }

  async deleteProgram(id: string): Promise<void> {
    await db.delete(programs).where(eq(programs.id, id));
  }

  async getEmissions(): Promise<Emission[]> {
    return db.select().from(emissions);
  }

  async createEmission(emission: InsertEmission): Promise<Emission> {
    const [created] = await db.insert(emissions).values(emission).returning();
    return created;
  }

  async updateEmission(id: string, emission: Partial<InsertEmission>): Promise<Emission> {
    const [updated] = await db.update(emissions).set(emission).where(eq(emissions.id, id)).returning();
    return updated;
  }

  async deleteEmission(id: string): Promise<void> {
    await db.delete(emissions).where(eq(emissions.id, id));
  }

  async getContactInfo(): Promise<ContactInfo | undefined> {
    const [info] = await db.select().from(contactInfo).limit(1);
    return info;
  }

  async updateContactInfo(info: InsertContactInfo): Promise<ContactInfo> {
    const existing = await this.getContactInfo();
    if (existing) {
      const [updated] = await db.update(contactInfo).set({ ...info, updatedAt: new Date() }).where(eq(contactInfo.id, existing.id)).returning();
      return updated;
    }
    const [created] = await db.insert(contactInfo).values(info).returning();
    return created;
  }
}

export const storage = new DatabaseStorage();
