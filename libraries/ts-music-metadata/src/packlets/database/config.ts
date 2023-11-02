import { File as JsonFile } from '@fgv/ts-json';
import { Converter, Converters, Result, captureResult } from '@fgv/ts-utils';

/**
 * Represents the secrets a music DB configuration.
 * @public
 */
export interface IMusicDbSecretsConfig {
  /**
   * Connection string used to connect to the database server.
   */
  connectionString: string;
}

/**
 * Converter to convert `any` to validated, strongly-typed {@link Database.IMusicDbSecretsConfig | MusicDbSecretsConfig}.
 * @public
 */
export const musicDbSecretsConfig: Converter<IMusicDbSecretsConfig, unknown> =
  Converters.strictObject<IMusicDbSecretsConfig>({
    connectionString: Converters.string
  });

class MusicDbSecretsConfig implements IMusicDbSecretsConfig {
  public readonly connectionString: string;

  public constructor(pathOrConfig?: string | IMusicDbSecretsConfig) {
    const fromEnv = process.env.MUSIC_DB_CONNECTION;
    if (typeof fromEnv === 'string') {
      this.connectionString = fromEnv;
    } else if (typeof pathOrConfig === 'string') {
      const config = JsonFile.convertJsonFileSync(pathOrConfig, musicDbSecretsConfig).orThrow();
      this.connectionString = config.connectionString;
    } else if (typeof pathOrConfig === 'object') {
      this.connectionString = pathOrConfig.connectionString;
    } else {
      throw new Error(`No connection string supplied or in environment`);
    }
  }
}

/**
 * Represents the public properties of a music db configuration.
 * @public
 */
export interface IMusicDbPublicConfig {
  /**
   * specific database to connect to.
   */
  database: string;
}

/**
 * Converter to convert `any` to validated, strongly-typed {@link Database.IMusicDbPublicConfig | IMusicDbPublicConfig}.
 * @public
 */
export const musicDbPublicConfig: Converter<IMusicDbPublicConfig, unknown> =
  Converters.strictObject<IMusicDbPublicConfig>({
    database: Converters.string
  });

/**
 * Full music db configuration.
 * @public
 */
export type IMusicDbConfig = IMusicDbSecretsConfig & IMusicDbPublicConfig;

/**
 * Configuration for a music database.
 * @public
 */
export class MusicDbConfig implements IMusicDbConfig {
  private readonly _secrets: MusicDbSecretsConfig;
  private readonly _config: IMusicDbPublicConfig;

  /**
   * {@inheritdoc Database.IMusicDbSecretsConfig.connectionString}
   */
  public get connectionString(): string {
    return this._secrets.connectionString;
  }

  /**
   * {@inheritdoc Database.IMusicDbPublicConfig.database}
   */
  public get database(): string {
    return this._config.database;
  }

  private constructor(config: string | IMusicDbPublicConfig, connection?: string | IMusicDbSecretsConfig) {
    this._secrets = new MusicDbSecretsConfig(connection);
    if (typeof config === 'string') {
      this._config = JsonFile.convertJsonFileSync(config, musicDbPublicConfig).orThrow();
    } else {
      this._config = config;
    }
  }

  /**
   * Constructs a new {@link Database.MusicDbConfig | music DB configuration} from a supplied {@link Database.IMusicDbPublicConfig | public configuration}
   * and optional {@link Database.IMusicDbSecretsConfig | secrets}.  Secrets will be read from the environment if not supplied.
   * @param config - path to a configuration file or a {@link Database.musicDbPublicConfig | MusicDbPublicConfig} with configuration for the database.
   * @param connection - optional path to a configuration file or {@link Database.IMusicDbSecretsConfig | IDbConnectionConfig}.  Uses environment if not supplied.
   * @returns `Success` with the corresponding config on success, or `Failure` with an error message if a problem occurs.
   */
  public static create(
    config: string | IMusicDbPublicConfig,
    connection?: string | IMusicDbSecretsConfig
  ): Result<MusicDbConfig> {
    return captureResult(() => new MusicDbConfig(config, connection));
  }
}
