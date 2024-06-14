import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  console.log("Cache GiTHub callback");

  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  if (code === null) {
    throw new Error("code is null");
  }

  console.log(
    "Getting token",
    `https://github.com/login/oauth/access_token?client_id=${process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID}&client_secret=${process.env.GITHUB_CLIENT_SECRET}&code=${code}`
  );

  const res = await fetch(
    `https://github.com/login/oauth/access_token?client_id=${process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID}&client_secret=${process.env.GITHUB_CLIENT_SECRET}&code=${code}`,
    {
      method: "POST",
      headers: {
        Accept: "application/json",
      },
    }
  );

  const body = await res.json();
  if (body === undefined) {
    throw new Error("failed to fetch GitHub access token");
  }

  console.log("fetched GitHub access token", body);

  const accessToken = body.access_token;

  return NextResponse.redirect(
    `${process.env.APP_ORIGIN}?access_token=${accessToken}`
  );
}
