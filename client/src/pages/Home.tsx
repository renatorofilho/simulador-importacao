import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getLoginUrl } from "@/const";
import { useLocation } from "wouter";
import { BarChart3, Database, Lock, Zap, ArrowRight } from "lucide-react";

export default function Home() {
  const { user, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();

  if (isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <nav className="border-b bg-white">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <div className="text-2xl font-bold text-blue-600">
              Simulador de Importação Pro
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">
                Bem-vindo, {user?.name || "Usuário"}
              </span>
              <Button onClick={() => navigate("/simulations")}>
                Acessar Simulações
              </Button>
            </div>
          </div>
        </nav>

        <main className="container mx-auto px-4 py-12">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">
              Simulador de Importação Pro
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Calcule custos de importação com precisão tributária
            </p>
            <Button size="lg" onClick={() => navigate("/simulations")}>
              Criar Nova Simulação
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-12">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-blue-600" />
                  Cálculos Precisos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Integração em tempo real com a API Siscomex para alíquotas
                  atualizadas de NCM
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="w-5 h-5 text-green-600" />
                  Cache Inteligente
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Sistema de cache com expiração de 24h para otimizar
                  performance
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-purple-600" />
                  Múltiplos Regimes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Suporte para Simples Nacional, Lucro Real e Lucro Presumido
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="w-5 h-5 text-red-600" />
                  Dados Seguros
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Autenticação segura e persistência de dados com banco de dados
                </p>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-blue-50 border-blue-200">
            <CardHeader>
              <CardTitle>Funcionalidades Principais</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 font-bold">✓</span>
                  <span>
                    Busca automática de alíquotas de NCM via API Siscomex
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 font-bold">✓</span>
                  <span>
                    Cálculo completo de impostos (II, IPI, PIS, COFINS, ICMS)
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 font-bold">✓</span>
                  <span>Suporte para TTDs 409 e 410 de Santa Catarina</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 font-bold">✓</span>
                  <span>Cálculo de Valor Aduaneiro baseado em Incoterms</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 font-bold">✓</span>
                  <span>Rateio de despesas por CIF, peso, volume ou valor</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 font-bold">✓</span>
                  <span>Cálculo de preço unitário CIF e desembaraçado</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 font-bold">✓</span>
                  <span>Fator de importação automático</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 font-bold">✓</span>
                  <span>Persistência de simulações com histórico completo</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-slate-50">
      <nav className="border-b bg-white/80 backdrop-blur">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="text-2xl font-bold text-blue-600">
            Simulador de Importação Pro
          </div>
          <Button asChild>
            <a href={getLoginUrl()}>Entrar</a>
          </Button>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-20">
        <div className="max-w-3xl mx-auto text-center mb-20">
          <h1 className="text-5xl font-bold mb-6">
            Simule seus custos de importação com precisão
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            Integração em tempo real com Siscomex, cálculos tributários
            completos e suporte para TTDs de Santa Catarina
          </p>
          <Button size="lg" asChild className="gap-2">
            <a href={getLoginUrl()}>
              Começar Agora
              <ArrowRight className="w-4 h-4" />
            </a>
          </Button>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-20">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-blue-600" />
                API Siscomex
              </CardTitle>
              <CardDescription>
                Integração em tempo real
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm">
                Busque alíquotas atualizadas de NCM diretamente da Receita
                Federal
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-green-600" />
                Cálculos Completos
              </CardTitle>
              <CardDescription>
                Todos os impostos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm">
                II, IPI, PIS, COFINS, ICMS e muito mais com precisão
                tributária
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5 text-purple-600" />
                Persistência
              </CardTitle>
              <CardDescription>
                Salve suas simulações
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm">
                Acesse seu histórico de simulações a qualquer momento
              </p>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-gradient-to-r from-blue-50 to-slate-50 border-blue-200 mb-20">
          <CardHeader>
            <CardTitle>Recursos Principais</CardTitle>
            <CardDescription>
              Tudo que você precisa para simular importações
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <span className="text-blue-600 font-bold text-lg">✓</span>
                <div>
                  <p className="font-medium">Busca de NCM Automática</p>
                  <p className="text-sm text-muted-foreground">
                    Integração com API Siscomex
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-blue-600 font-bold text-lg">✓</span>
                <div>
                  <p className="font-medium">TTDs de Santa Catarina</p>
                  <p className="text-sm text-muted-foreground">
                    409 e 410 com cálculos específicos
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-blue-600 font-bold text-lg">✓</span>
                <div>
                  <p className="font-medium">Múltiplos Regimes</p>
                  <p className="text-sm text-muted-foreground">
                    Simples, Lucro Real e Presumido
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-blue-600 font-bold text-lg">✓</span>
                <div>
                  <p className="font-medium">Incoterms Completos</p>
                  <p className="text-sm text-muted-foreground">
                    FOB, CIF, EXW, DDP e mais
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-blue-600 font-bold text-lg">✓</span>
                <div>
                  <p className="font-medium">Cache Inteligente</p>
                  <p className="text-sm text-muted-foreground">
                    24 horas de validade com atualização manual
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-blue-600 font-bold text-lg">✓</span>
                <div>
                  <p className="font-medium">Rateio de Despesas</p>
                  <p className="text-sm text-muted-foreground">
                    CIF, peso, volume ou valor
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="text-center">
          <p className="text-muted-foreground mb-6">
            Pronto para começar a simular?
          </p>
          <Button size="lg" asChild className="gap-2">
            <a href={getLoginUrl()}>
              Entrar com Manus
              <ArrowRight className="w-4 h-4" />
            </a>
          </Button>
        </div>
      </main>
    </div>
  );
}
