import { useCallback, useEffect, useState } from 'react';

type GithubUser = {
  login: string;
  avatar_url: string;
  html_url: string;
  name: string | null;
  bio: string | null;
  followers: number;
  following: number;
  public_repos: number;
  blog: string | null;
  location: string | null;
  company: string | null;
};

type GithubRepo = {
  id: number;
  name: string;
  html_url: string;
  description: string | null;
  stargazers_count: number;
  forks_count: number;
  language: string | null;
  updated_at: string;
};

type GithubPanelProps = {
  username: string;
};

export function GithubPanel({ username }: GithubPanelProps) {
  const [githubUser, setGithubUser] = useState<GithubUser | null>(null);
  const [githubRepos, setGithubRepos] = useState<GithubRepo[]>([]);
  const [githubLoading, setGithubLoading] = useState(false);
  const [githubError, setGithubError] = useState<string | null>(null);

  const loadGithub = useCallback(async () => {
    setGithubLoading(true);
    setGithubError(null);
    try {
      const userResponse = await fetch(`https://api.github.com/users/${username}`);
      if (!userResponse.ok) {
        throw new Error(`GitHub user request failed: ${userResponse.status}`);
      }
      const userData = (await userResponse.json()) as GithubUser;
      setGithubUser(userData);

      const reposResponse = await fetch(`https://api.github.com/users/${username}/repos?per_page=6&sort=updated`);
      if (!reposResponse.ok) {
        throw new Error(`GitHub repos request failed: ${reposResponse.status}`);
      }
      const reposData = (await reposResponse.json()) as GithubRepo[];
      setGithubRepos(reposData);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      setGithubError(message);
      setGithubUser(null);
      setGithubRepos([]);
    } finally {
      setGithubLoading(false);
    }
  }, [username]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadGithub();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadGithub]);

  return (
    <section className="github-card" aria-label="GitHub 信息">
      <div className="github-card-header">
        <div className="github-card-title">GitHub</div>
        <div className="github-card-actions">
          <button type="button" onClick={() => void loadGithub()} disabled={githubLoading}>
            {githubLoading ? '加载中...' : '刷新'}
          </button>
        </div>
      </div>

      {githubError && <div className="github-error">加载失败：{githubError}</div>}

      {!githubError && !githubUser && githubLoading && (
        <div className="github-loading">正在拉取 @{username} 的信息...</div>
      )}

      {githubUser && (
        <div className="github-content">
          <div className="github-profile">
            <a className="github-avatar-link" href={githubUser.html_url} target="_blank" rel="noreferrer">
              <img className="github-avatar" src={githubUser.avatar_url} alt={githubUser.login} />
            </a>
            <div className="github-profile-main">
              <div className="github-name-row">
                <a className="github-name" href={githubUser.html_url} target="_blank" rel="noreferrer">
                  {githubUser.name ?? githubUser.login}
                </a>
                <span className="github-username">@{githubUser.login}</span>
              </div>
              {githubUser.bio && <div className="github-bio">{githubUser.bio}</div>}
              <div className="github-meta">
                {githubUser.location && <span className="github-meta-item">{githubUser.location}</span>}
                {githubUser.company && <span className="github-meta-item">{githubUser.company}</span>}
                {githubUser.blog && (
                  <a
                    className="github-meta-item github-link"
                    href={githubUser.blog.startsWith('http') ? githubUser.blog : `https://${githubUser.blog}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {githubUser.blog}
                  </a>
                )}
              </div>
              <div className="github-stats">
                <div className="github-stat">
                  <div className="github-stat-value">{githubUser.public_repos}</div>
                  <div className="github-stat-label">Repos</div>
                </div>
                <div className="github-stat">
                  <div className="github-stat-value">{githubUser.followers}</div>
                  <div className="github-stat-label">Followers</div>
                </div>
                <div className="github-stat">
                  <div className="github-stat-value">{githubUser.following}</div>
                  <div className="github-stat-label">Following</div>
                </div>
              </div>
            </div>
          </div>

          {githubRepos.length > 0 && (
            <div className="github-repos">
              <div className="github-repos-title">最近更新</div>
              <div className="github-repo-grid">
                {githubRepos.map((repo) => (
                  <a key={repo.id} className="github-repo" href={repo.html_url} target="_blank" rel="noreferrer">
                    <div className="github-repo-name">{repo.name}</div>
                    {repo.description && <div className="github-repo-desc">{repo.description}</div>}
                    <div className="github-repo-meta">
                      {repo.language && <span className="github-repo-pill">{repo.language}</span>}
                      <span className="github-repo-pill">★ {repo.stargazers_count}</span>
                      <span className="github-repo-pill">⑂ {repo.forks_count}</span>
                      <span className="github-repo-updated">{new Date(repo.updated_at).toLocaleDateString()}</span>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
