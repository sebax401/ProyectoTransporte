FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build

WORKDIR /src

COPY ["ApiTransporte.csproj", "./"]

RUN dotnet restore "ApiTransporte.csproj"

COPY . .

RUN dotnet publish "ApiTransporte.csproj" -c Release -o /app/publish

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final

WORKDIR /app

COPY --from=build /app/publish .

ENTRYPOINT ["dotnet", "ApiTransporte.dll"]